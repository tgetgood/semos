#!/usr/bin/env python

# Simple script to find all music files in a given set of directories, copy
# their ID3 data into JSON and POST it to a Solr instance. 

# Created: Sun 29 Jan 2012
# Modified: Sun 5 Feb 2012
# Author: Thomas Getgood <thomas.getgood@gmail.com>

# TODO:
# * Separate the 'find' subprocess call into a library function for portability.
# * Find files based on mime-type, not file extension.
# * Add support for multiple music directories.
# * Figure out how to get bitrate, length, size, etc. from eyeD3.

import sys, eyeD3, json, subprocess, multiprocessing, string, httplib

def jsonify_tags(files, host, port):

  tag = eyeD3.Tag()
  data = []

  for filename in files:
    try:
      tag.link(filename);
      datum = {}
      datum['title'] = tag.getTitle()
      datum['artist'] = tag.getArtist()
      datum['album'] = tag.getAlbum()
      datum['year'] = tag.getYear()
      datum['genre'] = tag.getGenre().getName() if tag.getGenre() else ''
      datum['label'] = tag.getPublisher() if tag.getPublisher() else ''
      datum['path'] = 'http://' + host + ':' + port + filename
    except:
      print filename

    data.append(datum)
 
  return json.dumps(data)

###### jsonify_tags



def send_to_index(data, host, port):

  headers = {"Content-type":"application/json"}

  req = httplib.HTTPConnection(host, port)
  req.request("POST", url="/solr/update/json?commit=true", body = data, headers = headers)
  
###### send_to_index



if __name__ == '__main__':

  if len(sys.argv) < 7:
    #TODO: Fix this; it's a fiasco.
    sys.stderr.write('Usage: build_index.py LOCAL_HOSTNAME LOCAL_PORT SOLR_HOSTNAME SOLR_PORT MUSIC_DIR FILETYPE_1 [FILETYPE_2 ...]')
    sys.exit()

  HOST = sys.argv[1]
  PORT = sys.argv[2]
  SOLR_HOST = sys.argv[3]
  SOLR_PORT =  sys.argv[4]
  MUSIC_DIR = sys.argv[5]
  FILE_TYPES = sys.argv[6:]

  to_find = []
  for x in FILE_TYPES:
    to_find += ['-name', '*.' + x, '-o']
  to_find = to_find[:-1]

  files = subprocess.check_output(['find', MUSIC_DIR] + to_find)
  files = string.split(files, sep='\n')

  send_to_index(jsonify_tags(files, HOST, PORT), SOLR_HOST, SOLR_PORT)

  #pool = multiprocessing.Pool(6)

  #for i in range(0, len(files), 200):
  #  pool.apply_async(send_to_index, (jsonify_tags(files[i:i+200], HOST, PORT), SOLR_HOST, SOLR_PORT))

# This should be good practice, no?
  #pool.close()
  #pool.join()

