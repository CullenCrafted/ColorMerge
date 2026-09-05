# ColorMerge

ColorMerge is a dependency-free browser color-mixing game deployed as a static Vercel site.

## Local preview

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Rewarded advertising

The game is integrated with the Google Ad Placement API for AdSense H5 Games rewarded ads. Until an approved publisher ID is configured, the rewarded break displays ColorMerge's direct-sponsorship house ad.

To activate Google H5 Games Ads:

1. Obtain AdSense and H5 Games Ads approval for `colormerge.xyz`.
2. Set `adsensePublisherId` in `ads-config.js` to the approved `ca-pub-…` ID.
3. Optionally set `adChannelId` for reporting.
4. Set `testMode: true` while testing fake ads, then restore `false` before production.
5. Publish an `ads.txt` entry using the exact publisher ID shown in AdSense.

The extra-heart reward is granted only through the `adViewed` callback. Closing a Google rewarded ad early does not grant the reward.
