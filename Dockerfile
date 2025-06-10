FROM scratch

WORKDIR /app

EXPOSE 443

ENTRYPOINT [ "/app/app" ]
