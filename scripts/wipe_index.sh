#!/bin/bash

# Wipes solr index completely clean.
#
# Only works from localhost (provided tomcat is configured properly). Use with
# caution. 

curl 'localhost:8080/solr/update/?commit=true' --data-binary '<delete><query>*:*</query></delete>' -H 'Content-type:text/xml' 
