import http.server
import socketserver
import os

PORT = 8000

web_dir = os.path.join(os.path.dirname(__file__), 'public')
os.chdir(web_dir)

Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)
print("Serving at port", PORT)
httpd.serve_forever()