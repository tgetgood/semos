#!/bin/bash

# Basic install for solr config files. Will need substantial customisation per
# system at present. Use this file as a guideline.

# N.B. I'm using tomcat to serve Solr, but any serverlet container should do.
# If you use something else, adapt the settings in solr-tomcat.xml as
# appropriate.

# Also multicore solr will need modifications, but if you know how to set up
# multicore solr, you can figure it out.

TOMCAT_CONF=/etc/tomcat6
SOLR_CONF=/etc/solr
SOLR_HOME=/user/share/solr

backup_and_link() {
  if [ -f $2 -a ! -h $2 ]
  then
    mv $2 $2.bac
  fi

  ln -sf $1 $2
}

backup_and_link ./solr-tomcat.xml $TOMCAT_CONF/solr-tomcat.xml
backup_and_link ./solr-tomcat.xml $TOMCAT_CONF/Catalina/localhost/solr.xml

backup_and_link ./tomcat.policy $SOLR_CONF/tomcat.policy

backup_and_link ./solrconfig.xml $SOLR_HOME/conf/solrconfig.xml
backup_and_link ./schema.xml $SOLR_HOME/conf/schema.xml

