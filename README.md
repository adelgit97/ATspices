# A.T. Spices

## Rebuild SEO pages

After changing `data/products.csv` or the deployment version, run:

```powershell
node scripts/generate-seo.mjs
```

The command regenerates these build outputs:

- `ar/product/` and `en/product/`
- `ar/category/` and `en/category/`
- `sitemap.xml`
- `robots.txt`

The four product/category directories are generated content and are safe to delete before rerunning the command. The generator cleans only those directories; it does not remove manually maintained site files or assets.
