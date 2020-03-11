# Do you want to know why it takes so long for your Haskell project to compile?

YES

## Use this shell script in a stack project

In this repo there's a shell script `stack-passes` that reads from your `.stack-work` directory.

## Dependencies?

You'll need `textql`. You can get it from `sudo apt install textql` in Debian or Ubuntu.

## Ok, how do I make it go?

Change into a directory where you've built a stack project and run `stack-passes`.

That script will create a new file `ghc-passes-grouped.csv`. Copy that file into your clone of this project, and see the results by navigating to `file:///home/bergey/projects/ghc-passes-graph/index.html` in your browser.

# How do I turn this information into actions to reduce my compile time?

For incremental builds, try to make your module structure as tree shaped as possible.
When you change a module that all other modules use, all modules must be recompiled.
The more tree shaped your package dependencies, the less time spent doing incremental compiles when making changes.
