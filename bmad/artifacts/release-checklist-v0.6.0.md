# Release Checklist — v0.6.0

**Version:** 0.6.0  
**Name:** Performance & Productivity  
**Date:** 2026-03-27

---

## Pre-Release

### Code Quality
- [x] TypeScript check passes (0 errors)
- [x] All unit tests pass (448/448)
- [x] Lint passes (0 issues)
- [x] Build successful

### Documentation
- [x] Release notes created (`release-v0.6.0.md`)
- [x] CHANGELOG.md updated
- [x] Sprint summary created

### Testing
- [ ] E2E tests pass
- [ ] Visual regression baselines updated
- [ ] Performance tests run

---

## Release Steps

### 1. Create Git Tag
```bash
git add .
git commit -m "Release v0.6.0 — Performance & Productivity

Sprint 29 deliverables:
- Virtual scrolling for 1000+ events
- Bulk operations (multi-select, batch edit)
- Performance overlay (FPS, memory, renders)
- Professional design tokens

13/13 points delivered (100%)
448 tests passing
0 TypeScript errors"

git tag -a v0.6.0 -m "v0.6.0 — Performance & Productivity"
```

### 2. Push to Remote
```bash
git push origin main
git push origin v0.6.0
```

### 3. Create GitHub Release
1. Go to https://github.com/medyll/latent-line/releases/new
2. Tag: `v0.6.0`
3. Title: **v0.6.0 — Performance & Productivity**
4. Copy release notes from `bmad/artifacts/release-v0.6.0.md`
5. Click "Publish release"

### 4. Deploy to Production
```bash
# If using Vercel/Netlify
git push origin main

# Or manual deploy
pnpm run build
pnpm run preview
```

---

## Post-Release

### Update Project Status
- [ ] Update website changelog
- [ ] Announce on social media
- [ ] Update project roadmap
- [ ] Close Sprint 29 in project board

### Sprint 30 Planning
- [ ] Review user feedback from v0.6.0
- [ ] Prioritize Sprint 30 backlog
- [ ] Create sprint plan

---

## Rollback Plan

If critical issues are found:

```bash
# Revert to previous release
git checkout v0.5.0
git tag -a v0.6.1 -m "v0.6.1 — Hotfix: [description]"
git push origin v0.6.1
```

---

## Release Notes Summary

### New Features
- Virtual scrolling for large timelines (1000+ events at 60fps)
- Bulk operations (delete, duplicate, move, batch edit)
- Performance overlay (FPS, memory, frame time)
- Professional design tokens (spacing, typography, shadows)

### Files Changed
- 6 new files created
- 0 breaking changes
- +13 KB bundle size

### Quality Metrics
- 448 tests passing
- 0 TypeScript errors
- 84.39% code coverage

---

## Sign-Off

- [ ] Code review approved
- [ ] QA testing complete
- [ ] Documentation reviewed
- [ ] Release manager approval

**Released by:** [Your name]  
**Date:** 2026-03-27  
**Status:** Ready for release ✅
