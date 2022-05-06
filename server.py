#!/usr/bin/python3

from http.server import *

server = HTTPServer(('localhost', 8080), CGIHTTPRequestHandler)
server.serve_forever(1)