---
title: CV
description: True Persona
date: 2022-12-31
lastmod: 2024-04-30
menu:
  main:
    weight: -50
    params:
      icon: user
---

- **Name:** Yinchun Pang (ホウイハル)
- **Email:** <mailto>azusa146@gmail.com<mailto>
- **Phone:** +86 13265423108 | GV +1 9255265365 | +81 09018110554
- **LinkedIn:** [azusachino](https://www.linkedin.com/in/azusachino/)
- **Github:** [azusachino](https://github.com/azusachino)
- **Birth:** 1996.09.09
- **Education:** Changsha University of Science and Technology - Information Management and Information System (Bachelor) - 2014/09 -- 2018/06

## Skills

- Programming Languages: Java(JNI), Python, Golang, JavaScript, Rust
  - Java Frameworks: Spring Boot, Spring Cloud, Netty
  - Misc Frameworks: gRPC, Mybatis-Plus
- Databases: MySQL, Redis, ELK, Prometheus
- Middlewares: Kafka, XXLJOB, Nacos
- DevOps: AWS, Git, Podman, Kubernetes
- IDEs: IDEA, VSCode, NeoVim
- Language: Chinese(Native), English(Working Proficiency - IETLS 6.5), Japanese(Conversation Proficiency - N1)
- Certification: [AWS SAP](https://www.credly.com/badges/5dd714e3-6476-4389-925e-6b61bfa668fd)

## Working Experiences

### iFLYTEK Co., Ltd

- Department: RTC Research Team
- Position: Backend Engineer
- Period: 2021.01 ~ Today
- Responsibility
  - Maintaining the Java version SDK of our RTC platform's client-side ability
  - Maintaining the RTC platform Logging Solution (also related components)
  - Maintaining some other microservices which support our RTC platform
  - Contributing new features to our RTC platform's brain, the signaling service

### 合肥顶峰数码科技有限公司

- Department: Development Department
- Position: Backend Engineer
- Period: 2019.01 ~ 2020.12
- Responsibility
  - Contributing new features to the project Kessaisyoukai

## Projects

### RTC Java SDK

- Brief: Java version SDK of our RTC platform's client-side ability
- Position: Maintainer
- Tech Stack
  - Java & Java Native Interface
  - Spring Boot Starter
  - C++ & Cmake
- Strengths
  - Easy to use the client-side ability on the SERVER
  - Use Spring Boot Starter to boost our users' application setup
  - Capable of simulating hundreds of clients within seconds

### RTC Wechat Agent

- Brief: A work-around solution for ability-restricted devices (Wechat Mini Program)
- Position: Maintainer
- Tech Stack
  - Java
  - WebSocket
  - Spring Boot & Spring Cloud (Gateway)
  - [SRS](https://github.com/ossrs/srs)
  - [srs-exporter](https://github.com/azusachino/srs-exporter) (Golang)
  - Redis
- Strengths
  - This work-around solution helps non-RTP compliant devices to connect to our RTC platform
  - The srs-exporter acts as a sidecar, helps SRS to do service registration, and reports metrics for prometheus scraping

### RTC Logging Solution

- Brief: A complete logging solution for our RTC platform
- Position: Maintainer
- Tech Stack
  - ELK Stack
  - Filebeat
  - Zookeeper & Kafka
  - Java
  - Spring Boot & Spring Cloud
  - gRPC
  - Prometheus & Grafana
  - VueJS
  - MySQL
  - Redis
- Strengths
  - High throughput, Low Latency
  - Dynamic Architecture (cluster version, single-machine version)
  - No more worry for debugging problems while it's only occurred on our users' devices
  - Search log online or download log files offline by using our admin web page
  - Check the metric statistics on the grafana page

### Kessaisyoukai

- Brief: Typical Content Management System
- Position: Contributor
- Tech Stack
  - Java
  - Spring MVC
  - JSP
  - VueJS
- Strengths
  - Monolith web application, easy to ship and deploy

## Misc

### Language

- Chinese: Native Level
- English: Fluent Working Level (IELTS - 6.5)
- Japanese: Fluent Conversation Level (N1)
