import http.server
import socketserver
import os
import mimetypes

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')

class FinculatorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), FinculatorHandler) as httpd:
        print(f"Finculator HTTP Server active at http://localhost:{PORT}")
        httpd.serve_forever()
