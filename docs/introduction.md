---
id: introduction
title: Introduction
---

## Preamble

Hyrest is a framework for developing modern (web) applications full-stack in [Typescript](https://www.typescriptlang.org/).

This guide does not only want to introduce you into using Hyrest, but aims to also help you designing the stack for your application
from thr ground up.

Hyrest provides and utilizes many design patterns which make developing your application fast, scalable and understandable.

Before diving right into cloning a boilerplate and starting to develop your application, you should carefully read this guide,
decide what set of patterns, decisions, technologies (including Hyrest) and architecture is the correct one for your project.

After reading this guide you will know whether you should use Hyrest at all and hopefully have a better understanding about how to
structure your web project at all (with a focus on, but not limited to its web-frontend part).

## About the state of modern web development

The web now has been around for a while and many ways of getting your content out have been found since.

- [Handwritten static HTML pages](https://en.wikipedia.org/wiki/HTML)
- [Static Site generators](https://www.staticgen.com/)
- [Server-side (template) rendering](https://en.wikipedia.org/wiki/Server-side_scripting)
- [Single-page Applications](https://en.wikipedia.org/wiki/Single-page_application)
- [Interactive editors](https://en.wikipedia.org/wiki/List_of_HTML_editors)
- [Hosted (blog) solutions](https://en.wikipedia.org/wiki/Blog)
- [Websites in the Blockchain](https://www.reddit.com/r/Bitcoin/comments/544iwk/host_webpage_on_blockchain/)
- ...

While probably all of these solutions have their optimal use-cases, it is not always often obvious or foreseeable what to choose and
of course not all solutions are fit for all purposes.

Before starting to develop anything, or even select a stack it is crucial to decide which way to go (as after that point, turning back
is as good as impossible). 
