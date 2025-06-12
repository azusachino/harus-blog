---
title: My understanding on GC
created: 2024-01-04 04:01:00
modified: 2024-01-09 11:32:34
description: everything is recyclable
date: 2099-12-20
status: todo
slug: my-understanding-on-garbage-collection
image: images/2024/04/KyrgyzstanRainbow.png
categories:
  - Learning
tags:
  - Java
  - Learning
---

## What is GC

When the allocated memory to be returned to the OS, this process is so called GC.

There are mainly two ways, free by yourself or the runtime, say JVM or go_runtime.

## Algorithm in GC

The keypoint in GC is to find which `block` of memory could be recycled, which couldn't.

- reference counting
- reachable analysis

### Reference Counting

### Reachable Analysis

### Mark Sweep

### Mark Compact

### Generational

## How to choose Garbage Collector

### Serial

### G1GC

### ZGC

## Other Things

## References

- [Optimizing Java](https://amzn.asia/d/7MpVXZy)
- [ガベージコレクションのアルゴリズムと実装](https://amzn.asia/d/0UKqwNj)
- [深入理解 Java 虚拟机：JVM 高级特性与最佳实践（第 3 版）](https://amzn.asia/d/3hgXmHb)
