#!/usr/bin/python

import cgi, json, flickr

cgi_args = {
    key: value[0]
    for key, value
    in cgi.parse().items()
}

method_handlers = {
    'colors': flickr.color_list,
    'search': flickr.search,
}


def get_handler(method_name):
    return method_handlers.get(method_name, unknown_method_error)


def unknown_method_error():
    raise Exception('Unknown method, must be one of {}'.format(method_handlers.keys()))


try:
    handler = get_handler(cgi_args.pop('method', ''))
    response = handler(**cgi_args)
    json_response = json.dumps(response, indent=2)
except Exception as e:
    from traceback import format_exc

    json_response = json.dumps({
        'error': str(e),
        'trace': format_exc(limit=10)
    }, indent=2)

print('Content-Type: application/json\n\n')
print(json_response)
print('\n\n')
