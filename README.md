# Da Candy Shop Handoff Notes

## Admin Portal Deploy Reminder

Before committing or uploading admin portal changes to GitHub, rebuild the admin app and include the latest `admin/dist` files.

```bash
cd admin
npm run build
```

Then upload/commit the updated source files and the rebuilt `admin/dist` folder together so the live GitHub Pages admin portal matches the latest UI changes.
