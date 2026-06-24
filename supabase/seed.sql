-- Sample companies (no created_by, public seed data)
insert into public.companies (slug, name, domain, description, category) values
  ('apple', 'Apple', 'apple.com', 'Technology company making iPhones, Macs, and software.', 'Technology'),
  ('amazon', 'Amazon', 'amazon.com', 'E-commerce and cloud computing giant.', 'E-commerce'),
  ('netflix', 'Netflix', 'netflix.com', 'Streaming entertainment service.', 'Entertainment'),
  ('airbnb', 'Airbnb', 'airbnb.com', 'Online marketplace for short-term homestays and lodging.', 'Travel'),
  ('spotify', 'Spotify', 'spotify.com', 'Music streaming and podcast platform.', 'Entertainment'),
  ('uber', 'Uber', 'uber.com', 'Ridesharing and food delivery platform.', 'Transportation'),
  ('shopify', 'Shopify', 'shopify.com', 'E-commerce platform for online stores.', 'Technology'),
  ('slack', 'Slack', 'slack.com', 'Business communication and collaboration tool.', 'Technology'),
  ('notion', 'Notion', 'notion.so', 'All-in-one workspace for notes, tasks, and wikis.', 'Productivity'),
  ('figma', 'Figma', 'figma.com', 'Collaborative design and prototyping tool.', 'Design')
on conflict (slug) do nothing;
