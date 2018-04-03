from flickr_api import set_keys, Walker, Photo
from multiprocessing.pool import ThreadPool

# Flickr Constants
API_PIPELINE_DEPTH = 5  # Max requests per second
BQJ_LFZ = '1ba80a0b72b68f135d995f7b8e506092'  # Nothing to see here
BQJ_TFDSFU = '07a822ea82c52db6'  # Or here.

# Flickr's search IDs for various colors
# { flickr_id: html_code }
COLOR_CODES = {
    '0': '#ff2000',
    '1': '#a24615',
    '2': '#ff7c00',
    'b': '#ff9f9c',
    '4': '#fffa00',
    '3': '#ffcf00',
    '5': '#90e200',
    '6': '#00ab00',
    '7': '#00b2d4',
    '8': '#0062c6',
    '9': '#8c20ba',
    'a': '#f52394',
    'c': '#ffffff',
    'd': '#7c7c7c',
    'e': '#000000',
}

PREFERRED_SIZES = [
    'Large',
    'Original',
    'Medium'
]

def color_list(**kwargs):
    # List of color colors allowed in flickr search.
    return [
        {
            'id': color_id,
            'color': color_name
        }
        for color_id, color_name
        in COLOR_CODES.items()
    ]


def search(tags=None, page=1, **kwargs):
    '''
    Calls flickr.photos.search and retursn the 'Large' size
    :param tags: A comma-delimited list of tags.
                 Photos with one or more of the tags listed will be returned.
                 You can exclude results that match a term by prepending it with a - character.
    :param page: The page of results to return. If this argument is omitted, it defaults to 1.
    :param kwargs:
    :return: `list` of image URLs (`str`s) matching the search parameters.
    '''
    if tags is None:
        raise Exception('Required argument "tags" not provided')

    # API: https://www.flickr.com/services/api/flickr.photos.search.html
    search_args = {
        'tags': tags,
        'tag_mode': 'all',
        'page': page,
        'per_page': '10',
        'sort': 'interestingness-desc',
        'safe_search': '2', # Moderate
        'content_type': '7', # Photos, Screenshots, Other
    }

    # Overwrite any of the above based on input
    search_args.update(kwargs)
    if 'color_codes' in kwargs and kwargs.get('color_codes') is None:
        kwargs.pop('color_codes')

    set_keys(api_key=BQJ_LFZ, api_secret=BQJ_TFDSFU)

    pool = ThreadPool(processes=5)
    threads = []

    for photo in Photo.search(**search_args):
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
        print url

