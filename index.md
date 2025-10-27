---
layout: default
permalink: /
title: Meeshbhoombah
description: Governance focused decentralized systems engineering.
---
{% capture hero_markdown %}
{% include_relative HERO.md %}
{% endcapture %}
{{ hero_markdown | markdownify }}

{% capture work_markdown %}
{% include_relative WORK.md %}
{% endcapture %}
{{ work_markdown | markdownify }}

{% capture digest_markdown %}
{% include_relative DIGEST.md %}
{% endcapture %}
{{ digest_markdown | markdownify }}

<section class="home-writing">
  <h2>🖋️ Writing</h2>
  {% assign categories = 'Cryptocurrencies|Social Sciences|Computing|Startups|Food' | split: '|' %}
  {% assign live_posts = site.writing | where: 'status', 'live' %}
  {% for category in categories %}
    {% assign categorized = live_posts | where: 'category', category | sort: 'relative_path' %}
    {% if categorized != empty %}
    <section class="category">
      <h3>{{ category }}</h3>
      <ul>
        {% for post in categorized %}
          {% assign post_title = post.title | default: post.data.title %}
          {% if post_title == nil or post_title == '' %}
            {% assign post_lines = post.content | split: '\n' %}
            {% for line in post_lines %}
              {% assign trimmed = line | strip %}
              {% if trimmed != '' and trimmed | slice: 0, 2 == '# ' %}
                {% assign post_title = trimmed | remove_first: '# ' | strip %}
                {% break %}
              {% endif %}
            {% endfor %}
          {% endif %}
          {% assign first_live = post.first_live_at %}
          <li>
            <a href="{{ post.url | relative_url }}">{{ post_title }}</a>
            {% if first_live %}<span class="meta">{{ first_live | date: '%b %-d, %Y' }}</span>{% endif %}
          </li>
        {% endfor %}
      </ul>
    </section>
    {% endif %}
  {% endfor %}
</section>
