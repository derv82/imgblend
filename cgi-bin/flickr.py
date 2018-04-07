#!/usr/bin/python

import flickr_api
import multiprocessing.pool

# Flickr Constants
API_PIPELINE_DEPTH = 5  # Max requests per second
BQJ_LFZ = '1ba80a0b72b68f135d995f7b8e506092'  # Nothing to see here
BQJ_TFDSFU = '07a822ea82c52db6'  # Or here.

PREFERRED_SIZES = [
    'Large',
    'Original',
    'Medium'
]


def search(tags=None, page=1, **kwargs):
    """
    Calls flickr.photos.search and retursn the 'Large' size
    :param tags: A comma-delimited list of tags.
                 Photos with one or more of the tags listed will be returned.
                 You can exclude results that match a term by prepending it with a - character.
    :param page: The page of results to return. If this argument is omitted, it defaults to 1.
    :param kwargs:
    :return: `list` of image URLs (`str`s) matching the search parameters.
    """
    if tags is None:
        raise Exception('Required argument "tags" not provided')

    # API: https://www.flickr.com/services/api/flickr.photos.search.html
    search_args = {
        'tags': tags,
        'tag_mode': 'all',
        'page': page,
        'per_page': '10',
        'sort': 'interestingness-desc',
        'safe_search': '2',   # Moderate
        'content_type': '7',  # Photos, Screenshots, Other
    }

    # Overwrite any of the above based on input
    search_args.update(kwargs)
    if 'color_codes' in kwargs and kwargs.get('color_codes') is None:
        kwargs.pop('color_codes')

    flickr_api.set_keys(api_key=BQJ_LFZ, api_secret=BQJ_TFDSFU)

    pool = multiprocessing.pool.ThreadPool(processes=API_PIPELINE_DEPTH)
    threads = []

    for photo in flickr_api.Photo.search(**search_args):
        image_thread = pool.apply_async(get_image_thumbnail_urls, (photo, ))
        threads.append(image_thread)

    # Join threads & return the result.
    return [thread.get() for thread in threads]


def get_image_thumbnail_urls(photo):
    large_url = None
    available_sizes = photo.getSizes()
    for preferred_size in PREFERRED_SIZES:
        if preferred_size in available_sizes:
            large_url = available_sizes[preferred_size].get('source')

    if large_url is None:
        raise Exception('No image URL for sizes "{}" on Photo: {}'.format(','.join(PREFERRED_SIZES), repr(photo)))

    if 'Thumbnail' not in available_sizes:
        raise Exception('Failed to find URL for thumbnail for Photo: {}'.format(repr(photo)))

    thumb_url = available_sizes['Thumbnail'].get('source')

    return {
        'large': large_url,
        'thumb': thumb_url
    }


if __name__ == '__main__':
    # Example implementation
    for url in search('desert', page=1, color_codes=3):
        print(url)

