set dotenv-load := true

local:
  hugo server -D --bind "0.0.0.0" --port 1313 -d /tmp/mika

deploy:
  hugo -d /tmp/mika
  cp -R /tmp/mika/* /home/haru/Projects/project-github/harus-server/harus-blog/www-data
  rm -rf /tmp/mika
  rm -rf resources
