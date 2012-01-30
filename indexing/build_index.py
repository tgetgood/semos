#!/usr/bin/env python

# Simple script to find all music files in a given set of directories, copy
# their ID3 data into JSON and POST it to a Solr instance. 

# Created: 
# Author: Thomas Getgood

# TODO:
# * Set up config files to hold user settings.
# * Why does closing and joining the pool cause the program to do nothing?
# * Separate the find subprocess call into a library function for portability.
# * Find files based on mime-type, not file extension.
# * Add support for multiple music directories.

import eyeD3, json, subprocess, multiprocessing, string, httplib

HOST = 'localhost:'
MUSIC_DIR = '/home/thomas/storage/music'
FILE_TYPE = 'mp3'

def jsonify_tags(files):

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
      datum['path'] = HOST + filename
    except:
      print filename

    data.append(datum)
 
  data = json.dumps(data)

  headers = {"Content-type":"application/json"}

  req = httplib.HTTPConnection("localhost", port = 8080)
  req.request("POST", url="/solr/update/json?commit=true", body = data, headers = headers)
  
###### jsonify_tags

if __name__ == '__main__':
  files = subprocess.check_output(['find', MUSIC_DIR, '-name', '*.' + FILE_TYPE])
  files = string.split(files, sep='\n')

  pool = multiprocessing.Pool(6)

  for i in range(0, len(files), 50):
    pool.apply_async(jsonify_tags(files[i:i+50]))

# This should good practice, no?
  #pool.close()
  #pool.join()

