# Droplet

Droplet allows you to transfer files over network.

It works like a pipe and only buffers a little data during transfer. The one-time sharing link will be destroyed immediately when the transfer is done.

# Public Service
## Via Web
https://droplet.exchange

## Via commandline
You can also upload by cURL
```sh
curl -LT ${your file path} `https://d.ika.cx/${a unique id}/${file name}
```

* The length of ${a unique id} must >= 4, contains only alphebats and numbers. 
