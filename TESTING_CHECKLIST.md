# ACF Open Icons - Testing Checklist

## Quick Test (15 minutes)

**Do this first to catch major issues:**

- [ ] Activate plugin → no errors
- [ ] Activate license → works
- [ ] Open icon picker → modal opens, icons load
- [ ] Select icon → saves correctly
- [ ] Display icon on front-end → renders correctly
- [ ] Check for updates → shows correctly
- [ ] Update plugin → downloads and installs (if update available)

## Phase 1: Core Functionality (30 minutes)

### License System

- [ ] **Valid license** → activates, features work
- [ ] **Invalid license** → shows error, features blocked
- [ ] **Expired license** → grace period works, then blocks
- [ ] **No license** → activation prompt visible, features blocked
- [ ] **Deactivate** → status updates, can reactivate

### Icon Picker

- [ ] Modal opens/closes
- [ ] Search/filter works
- [ ] Select icon → saves to field
- [ ] Color selection works (tokens A, B, C)
- [ ] Icon displays in field preview
- [ ] Icon displays on front-end

### Update System

- [ ] **With valid license** → update downloads and installs
- [ ] **With invalid license** → update blocked with clear error
- [ ] Update check runs on activation
- [ ] Update appears in Plugins page

## Phase 2: Compatibility (20 minutes)

### WordPress Versions

- [ ] WordPress 5.0 (minimum) → works
- [ ] Latest WordPress → works
- [ ] No PHP warnings/errors

### PHP Versions

- [ ] PHP 7.4 (minimum) → works
- [ ] PHP 8.2 → works
- [ ] No deprecated function warnings

### ACF

- [ ] ACF Pro → works
- [ ] ACF Free → works
- [ ] ACF missing → graceful message (no fatal error)

## Phase 3: Edge Cases (20 minutes)

### License Edge Cases

- [ ] Network error during activation → handled gracefully
- [ ] Licensing server down → doesn't break site
- [ ] Expired license → grace period countdown works

### Update Edge Cases

- [ ] Network error during download → shows error
- [ ] Maintenance mode file cleanup → works
- [ ] Update interrupted → can retry

### Icon Edge Cases

- [ ] Missing iconKey → handled gracefully
- [ ] Invalid SVG → sanitized correctly
- [ ] Provider switch → existing icons still display

## Phase 4: Browser Testing (15 minutes)

**Test in 2 browsers (Chrome + one other):**

- [ ] Settings page loads
- [ ] Icon picker modal works
- [ ] License activation works
- [ ] No console errors

**Quick check in Safari/Firefox:**

- [ ] Icon picker opens
- [ ] No obvious visual issues

## Phase 5: Distribution (10 minutes)

### Build Process

- [ ] Run `npm run dist` → creates ZIPs
- [ ] Production ZIP contains only necessary files
- [ ] Production ZIP includes `USAGE_EXAMPLE.md`
- [ ] Version numbers match (0.6.0)

### S3 & Updates

- [ ] Upload ZIP to S3
- [ ] Proxy endpoint validates license correctly
- [ ] Download with valid license → works
- [ ] Download with invalid license → 403 error

## Phase 6: Real-World Scenarios (15 minutes)

### Common Use Cases

- [ ] Create ACF field group with icon field
- [ ] Add icon to post → displays correctly
- [ ] Use in repeater field → works
- [ ] Switch icon provider → migration tool appears
- [ ] Change color token → existing icons update
- [ ] Purge cache → icons reload

### Settings Page

- [ ] All sections save correctly
- [ ] License section always visible
- [ ] Other sections hidden when license invalid

## Critical Paths (Must Work)

**If these fail, don't release:**

1. ✅ Plugin activates without errors
2. ✅ License activates and validates
3. ✅ Icon picker opens and icons load
4. ✅ Icons save and display correctly
5. ✅ Updates download with valid license
6. ✅ Updates blocked with invalid license

## Quick Smoke Test (5 minutes)

**Before every release, test:**

- [ ] Activate plugin
- [ ] Activate license
- [ ] Pick an icon
- [ ] View on front-end
- [ ] Check for updates

## Notes

- **Focus on critical paths first** - if those work, you're 90% there
- **Browser testing** - Chrome + one other is usually enough
- **Edge cases** - Test the ones that could actually happen
- **Real-world scenarios** - Test how you'd actually use the plugin

## Sign-Off

Before release, verify:

- [ ] All critical paths work
- [ ] No console errors
- [ ] No PHP warnings (with WP_DEBUG on)
- [ ] Update system works end-to-end
- [ ] License system works correctly

**Total estimated time: ~2 hours for full test, 15 minutes for quick test**
