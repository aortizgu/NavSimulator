import xmlrpc.client

with xmlrpc.client.ServerProxy("http://localhost:8001/") as proxy:
    print("ret: %s" % str(proxy.SetAsm(3, [1, 2, 3, 4])))
