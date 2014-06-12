Fork of [YUI 2.x](https://github.com/yui/yui2) (now deprecated) for Jenkins.

## Building
The Builder project has been incorporated directly into the project to make it easier to build.  The build depends on
[Ant v1.7+](http://ant.apache.org/bindownload.cgi).

To build the Jenkins specific package:

```
ant package-yui-jenkins
```

This produces a .zip file in the `target` folder.  That zip can be expanded into the `war/src/main/webapp/scripts/yui` folder in Jenkins.

## Changelog (pre fork)

The following is a list of the changes (relevant to YUI sub-components used by Jenkins) made between the v2.9.0 release
(`bb504d9`) and fork point (`067c9f8`):

* Button:
    * Menu button sub-menu hiding/no-hiding changes on mousedown outside button.
    * Some exception handling
* Dom: What appear to be a few small bug fixes - nothing external facing.
* Event: Internal exception handling.
* Menu: IE <> 9 bug fix  *****
* Storage (Jenkins uses this?):
    * Internal event handling tweak.
    * Some regex foo around google gears storage.
    * Storage engine keymap lookup changes.
* Yahoo/Env: Opera 10+ version parsing.
* Yahoo/Lang: Falsy condition fix.

All changes seem to be safe since none effect the component interfaces.  For that reason, we overlayed the Jenkins changes
onto `master` and continued (Vs branching back at `067c9f8`).