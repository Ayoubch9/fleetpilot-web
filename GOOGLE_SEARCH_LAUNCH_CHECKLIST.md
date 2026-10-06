# Google Search Launch Checklist — MileVoxa

Canonical production host:
https://www.milevoxa.com

After deployment:

- Confirm https://milevoxa.com permanently redirects to https://www.milevoxa.com.
- Open /robots.txt and verify sitemap points to https://www.milevoxa.com/sitemap.xml.
- Open /sitemap.xml and confirm public pages only.
- Verify canonical tags on /, /pricing, /tools, /privacy, /terms, /data-deletion, and /contact.
- Verify private product pages return X-Robots-Tag: noindex, nofollow.
- Verify public pages return HTTP 200 and do not carry noindex.
- Add https://www.milevoxa.com to Google Search Console.
- Submit https://www.milevoxa.com/sitemap.xml.
- Use URL Inspection on /, /tools, one calculator, /privacy, /terms, /data-deletion, and /contact.
- Monitor Page Indexing, Crawl Stats, Core Web Vitals, security/manual-action reports, and structured-data reports.
