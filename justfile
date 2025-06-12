set dotenv-load := true

local:
  hugo server -D --bind "100.77.233.63" --port 23333 -d build

deploy:
  hugo -d /tmp/mika
  cp -R /tmp/mika/* /home/haru/Projects/project-github/harus-server/harus-blog/www-data
  rm -rf /tmp/mika
  rm -rf resources

prod:
  rm -rf build/*
  hugo -d build
  # needs tailscale
  scp -r build/* harus-mini:/home/haru/Projects/project-github/harus-server/harus-blog/www-data
  rm -rf build/*
  rm -rf resources/*
