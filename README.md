ImgBlend
========
Blend similar images together.


About
-----
Fetches images from Flickr and overlays the results on top of each other with an opacity filter.

Flickr's API allows searching by "color code". This usually results in similar-looking images. When blended together, the result is sometimes beautiful.


Screenshots
-----------

Searching for `forest` with the *Chartreuse* color code:

![Forest Search](https://i.imgur.com/tmixyvX.jpg?1)

------------

Searching for `amanita muscaria` (a type of mushroom) with the *Red* color code:

![Amanita Muscaria Search](https://i.imgur.com/KlmPnCc.jpg?1)

------------


Why?
----
Because I was bored and wanted to learn how to create a project in PyCharm.

The old version of this project ([derv82/ImageBlender](https://github.com/derv82/ImageBlender)) relied on Google Image Search's API which no longer works. And was also buggy.


Requirements
------------
See requirements.txt -- depends on the [flickr_api](https://github.com/alexis-mignon/python-flickr-api) by alexis-mignon.


Setup/Install
-------------

1. You need [Flickr API keys](https://www.flickr.com/services/api/keys/), create an account & application.
   * Store the API "key" and "secret" in a file `flickr_credentials.txt` in the root directory
   * First line of the .txt is the API Key
   * Second line of the .txt is the API Secret
2. `python server.py` to launch a server on localhost on port `8000`.
3. Visit http://localhost:8000/ in your browser.
