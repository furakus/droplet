# Droplet
Droplet let you share **arbitrarily huge** files over network.

It works like a pipe and only buffers a little data during transfer. The one-time sharing link will be destroyed immediately when the transfer is done.

## Public Service
### Via Browser
https://droplet.exchange

### Via Command Line
You can also upload by cURL
```sh
curl -LT ${your file path} https://d.ika.cx/${unique id}/${file name}
```
The length of `${unique id}` must >= 4, contains only alphebats and numbers. 

## Backend Pipe System
The HTTP pipe service is powered by [Furakus](https://github.com/pzread/furakus) with Rust
