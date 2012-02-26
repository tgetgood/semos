Semos
=====

Peer to peer distibuted music player.

Uses Apache Solr to create a searchable index of music files across any number of computers. Combined with a lightweight file server on each indexed machine and a web client, you get a music player. 

Created out of exasperation at not remembering which music was on my desktop, laptop, at home, at work, etc.. 

Info
----

Author: Thomas Getgood <thomas.getgood@gmail.com>
Version: I hesitate to even call it an alpha, but works in some ways.
Last edit: Sun, 26 Feb 2012

Overview
--------

The player consists of a search server, a music server, and a web client that can either be run locally, or serverd up via the client server. 


### Music server/indexer

The music server is responsible for serving up requested music files. It is also responsible for maintaining the index of music available on the host machine and updating the Solr server when this changes.

Automatic indexing is currently not working, so the index must be built manually. See `server/music/scripts/build_index.py` for usage instructions. Will probably only run on Unix/Linux, possibly Mac OS. I'm getting there. 

The intention is to add an authentication layer so that your music is not open to the world --- unless you want it to be --- but this is not implemented yet, so be warned that by running this continuously without some sort of reverse proxy of your own, all sorts of evil things might happen to you. 

### Solr server

The Solr server is a standard Solr deployment using the schema and configuration files shipped with this repo. I deploy Solr on Tomcat, but that's not terribly important. For the time being you'll have to convert the config files appropriately if you choose a different serverlet container. See the installation section for instructions on deploying Solr. 

### Web client

Bare bones client to search and play music. Still needs lots of work. The core components are jPlayer to play the music and the AJAX-Solr Javascript library to interact with Solr for search.

jPlayer uses HTML5 audio to play the music and falls back on flash if that fails. HTML5 audio still has it's problems, so the experience will vary. 

Progressive enhancement was not a priority in the design since nothing will work without Javascript and I have no intention of changing that. 

N.B. I am not a front end developer. Improvements to the client will be welcomed, and unconstructive criticism ignored. 

Installation
------------

Currently requires a fair bit of assembly. These instructions have only been tested on Ubuntu 10.04 but should be adaptable to any Unix-like system.

Fair bit of assemply? This is utterly insane. More detail might help, but a simpler setup process is essential if anyone is to ever use this. 

### Install Solr

These instructions run Solr 3.5.0 on Tomcat 6. Other versions of Solr may work and other containers definitely should, but are untested. 

There are instructions at http://wiki.apache.org/solr/SolrTomcat, but they're very technical and I'm hoping my instructions are easier.

Install tomcat

``` sh
$ apt-get install tomcat6
```

Download and unpack Solr

``` sh
$ wget http://apache.mirror.iweb.ca/lucene/solr/3.5.0/apache-solr-3.5.0.tgz
$ tar -zxf apache-solr-3.5.0.tgz
$ cp -R apache-solr-3.5.0/example/solr /usr/share
$ cp apache-solr-3.5.0/dist/apache-solr-3.5.0.war /usr/share/solr
$ ln -s /usr/share/solr/apache-solr-3.5.0.war /usr/share/solr/solr.war
$ cp -R apache-solr-3.5.0/contrib /usr/share/solr
$ mkdir /usr/share/solr/lib
$ cp apache-solr-3.5.0/dist/*.jar /usr/share/solr/lib
```

Run `servers/search/solr-config/setup.sh` to link the solr configuration in this repo to the correct places.

Set Tomcat to own the solr directory and restart it:

``` sh
$ chown -R tomcat:tomcat /usr/share/solr
$ /etc/init.d/tomcat6 restart # service tomcat6 restart on ubuntu
```

### Install and configure node

Install node

``` sh
$ apt-get install node
```

I'm not sure what verison this is currently at, so you may be better off downloading node from [github](https://github.com/joyent/node) and building it yourself.

Install npm

``` sh
$ curl http://npmjs.org/install.sh | sh
```

Install node packages for this project

``` sh
$ npm install cron
$ npm install mime
```

### Config files

Create files at `client/clientConfig.js` and `server/serverConfig.json` based on the provided example files. The proxy objects are only important if you enable the proxy in the final step (which you ought to). The hosts should be the IPs of the machines the services are running on and the ports should be left the same unless you know what you're doing with the exception of the music server port which is entirely arbitrary.

### Setting up the music server

Run `servers/music/scripts/build_index.py` with the parameters requested. If you've left all of the defaults in the config files above and your IP is a.b.c.d then this should look like the following (provided everything is running on one machine. 

``` sh
$ build_index.sh a.b.c.d 31337 a.b.c.d 8008 /path/to/music mp3 ogg flac ...
```

### Running the servers

Tomcat (and hence Solr) are already running from the Solr installation above. In addition run the following:

``` sh
$ node servers/music/server.js &
$ node servers/search/node-proxies/solrProxyExample.js &
$ node client/server.js & # This is optional, see below
```

Finally access the client at `localhost:8000` if running the third node server or at `file://path/semos/client/index.html` if not.

Good luck.
