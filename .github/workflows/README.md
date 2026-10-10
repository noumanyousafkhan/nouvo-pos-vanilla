# Build Workflow

## Trigger

- **Tag push** (`v1.0.0`, `v0.2.0`) — automatic build
- **Manual** — Actions tab → "Build Installers" → "Run workflow"

## Output

- Windows installer: `release/NOUVO POS Vanilla-Setup-X.Y.Z.exe`
- Linux AppImage: `release/NOUVO POS Vanilla-X.Y.Z.AppImage`
- Linux .deb: `release/nouvo-pos-vanilla_X.Y.Z_amd64.deb`

## Publish Flow

1. Push tag: `git tag v0.2.0 && git push origin v0.2.0`
2. GitHub Actions builds all installers
3. Draft release created — **NOT published**
4. Review draft at: GitHub → Releases
5. Test installers (if needed)
6. Click "Publish release" → clients ko bhejein

## Workflow Files

- `build.yml` — main build config
