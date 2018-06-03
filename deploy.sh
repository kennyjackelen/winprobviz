#!/bin/bash
imageName=kenny/winprobviz
containerName=winprobviz

docker build -t $imageName -f Dockerfile  .

echo Delete old container...
docker rm -f $containerName

echo Run new container...
docker run -d -p 49162:8080 -e SITE_ROOT=winprobviz --name $containerName $imageName