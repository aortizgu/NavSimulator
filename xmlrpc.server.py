from xmlrpc.server import SimpleXMLRPCServer
from xmlrpc.server import SimpleXMLRPCRequestHandler

# Restrict to a particular path.
class RequestHandler(SimpleXMLRPCRequestHandler):
    rpc_paths = ('/',)

# Create server
with SimpleXMLRPCServer(('0.0.0.0', 8001),
                        requestHandler=RequestHandler) as server:
    server.register_introspection_functions()

    # Register pow() function; this will use the value of
    # pow.__name__ as the name, which is just 'pow'.
    server.register_function(pow)

    # Register a function under a different name
    def adder_function0(x, y, z):
        print (x, y, z)
        return x + y
    server.register_function(adder_function0, 'SetAsm0')

    # Register a function under a different name
    def adder_function(x, y):
        print ("ASM ", x, "LAT ", y[0], "LON ", y[1], "PM ", y[2], "PMVALID", y[3])
        return "OK"
    server.register_function(adder_function, 'SetAsm')

    # Run the server's main loop
    server.serve_forever()