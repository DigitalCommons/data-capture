# NAME

data-capture

# OVERVIEW

This repository was created to be a place to store the raw data which
is the input to the [open-data][] pipeline generating data for the
Solidarity Economy Association's map sites. More specifically: to do
this in a way which allows changes to be detected before downloading,
by checking the ETAG header of the file in question. This works
courtesy of GitHub supplying this header on HTTP responses to GitHub
repository raw content queries (URLs like
`https://raw.githubusercontent.com/$user/$project/$path`)

Whether the files are added manually or by some other mechanism is not
important, the ETAG mechanism still works when it changes.  So a file
manually committed via the GitHub web UI, or via Git, works in this
respect just as well as a GiHub action which downloads and commits a
file. The latter is probably preferable as it means changes upstream
are detected with no further human intervention, but even the former
case allows new data to be added and processed by relatively
non-techinical means, an improvement from before when the scripts
needed to be manually invoked.

# DATA PRIVACY

NOTE: The data should not contain any sensitive information, or
anything for which consent has not been given to store on the open
internet, as this repository is public, for simplicity of access.

# REPOSITORY ORGANISATION AND USAGE

## Master branch

The master branch contains generic scripts, which may need to be
customised. It is intended that this branch remain generic, and that
each data source has its own branch with any settings specific to
itself, rather than sharing the master branch.

At the time of writing it includes the following files.

### [`.github/workflows/download.yml`][download.yml]

This is a GitHub workflow file which downloads an URL, typically
return CSV data, and commits the data to the branch the workflow is
run from. The data is stored in a directory named after the branch it
is run on (see below.)

It responds to the [workflow_dispatch][] event, whcih can be triggered
either manually on GitHub, or via the GitHub API. In the latter case,
the `spreadsheet-trigger.gs` script may be useful if the source is a
Google spreadsheet.

The main customisation this file will need is the correct URL for
downloads. Possibly, the data file's extension might need to change if
it is not CSV, or extra processing steps
added. See [ADDING NEW SOURCES](#adding-new-sources).

### [`src/spreadsheet-trigger.gs`][spreadsheet-trigger.gs]

This is a Google Apps script, which can be added to a spreadsheet and
bound to the "on edit" trigger to notify a GitHub action there is data
to download. 

It needs certain script properties defined to configure the
repository, API token and branch to
notify. See [ADDING NEW SOURCES](#adding-new-sources)

## Data branches

There should be one branch for each data source, containing a data
file in a diectory named after the branch. e.g.

    some-branch/data.csv

Besides the advantage that avoiding the interleaving of commits from
different sources makes it slightly easier to follow changes, the main
advantage to separating data on their own branches is that they can be
checked out separately. This keeps the amount of data a GitHub action
needs to check out in order to update the branch to the minimum.

Additionally putting the data in branches into distinctly named
folders has the potential advantage that branches can be merged
together without conflict, which may be useful when data needs to be
aggregated or compared.

# ADDING NEW SOURCES

Typically this requires creating a new branch, and if a GitHub action
is involved, customising the workflow configuration.  Successive
versions of the data gets committed to this branch in the same file.

## Action-driven data collection

These use the supplied [download.yml][] workflow configuration, or an
equivalent, to control the automated download of data on some external
event.

The data branches for these will typically be rooted on the master
branch, a they will need to adapt the [download.yml][] workflow
configuration. Additionally, in my experience GitHub's systems seem to
need a workflow file to be present on the master branch in order to
find them.  Workflows on other branches must be split off from a point
where the workflow configuration existed, even if they are modified.

In order to do this, create the branch from a commit on the master
branch, and commit the customised workflow on the new branch. Like
this (assuming you have a shell console and Git installed):

    git clone $repo_url # from GitHub
	cd $repo_dir
    git checkout -b $newbranch
	$EDITOR .github/workflows/download.yml # edit the config
    git add .github/workflows/download.yml
	git commit -m "new workflow for XXX"
	git push # back to GitHub	

Then, events which trigger the API and specify the branch via the
`ref` parameter should successfully kick off a new job.  See
documentation for the [workflow_dispatch API][] for more information
about this API call.

Check the Actions tab on GitHub, and any log files on the event source
(perhaps the trigger console on Google Scripts) for signs of problems
if this does not seem to work.

## Triggering a GitHub action when a Google spreadsheet is edited

The [spreadsheet-trigger.gs][] script in the master branch can be used
to start the above workflow when a user edits the spreadsheet.

In the target spreadsheet, select *Tools -> Script Editor* in the
menu. (You will need to be an editor for this to be present.) This
opens a new editor tab in your browser.

Here, set a project name of your choice, e.g. "data-capture
notifier". You can leave the empty code file named "Code.gs" there by default.

Copy and paste the [spreadsheet-trigger.gs][] code into this
script. Save it.

In the menu for the script, select *File -> Project Properties*.  This
should open a dialog. Select the "Script Properties" tab, and add
property rows as follows:

- `user_name` - The name of the GitHub user account to authenticate as
- `api_key` - The value should be a GitHub access token created with
  the aforementioned account, which has been granted `repo`
  permission.  See [creating a personal access token][] for
  instructions. The token should be treated as a password would and
  kept safe and secure from abuse. Also, ideally the account
  associated will be a dedicated one with the minimim access
  possible. Note that the developer accounts aren't really suitable,
  as if the developer leaves the project the token will stop
  working. Theft of the token also leaves the developer's other
  repositories open to abuse.
- `git_ref` - The name of the branch in the [data-capture][]
  repository to send the event to. In order to respond, it needs to
  have a workflow defined which responds to the
  the [workflow_dispatch][] event. This should have been set up
  according to the section above.
- `api_url` - The URL for the workflow dispatch API call. i.e.
  `https://api.github.com/repos/SolidarityEconomyAssociation/data-capture/actions/workflows/download.yml/dispatches`

**Security**: Google "Script Properties" are associated with this
script only, and are not duplicated along with the script if someone
makes a copy. This is important to avoid leaking sensitive information
like the `api_key`.  However, beware that anyone with editor access to
the spreadsheet will be able to inspect these properties and learn the
API key. There does not seem to be a way to avoid this, so be careful
about using this if you don't trust the editors of the account.  This
emphasies the wisdom of using a GitHub account with minimal access to
create the access token.

Not only this, the google account used to create and trigger the script
should not be one with any access to anything sensitive, as it appears
that the script executes with the rights of this account, and could be
modified to edit or delete other resources the user has access to.

The Github recommened way of authenticating apps like this one seems
to be to use the OAuth2 protocol.  However, implementing this looks
especially complicated and is currently deferred as a step for the
future. There are details in [Ben Collins article][] about using the
Gitub API from Google Scripts.

What we are currently doing instead is using the dedicated user
account [sea-bot][]. In addition to being simpler to authenticate,
this has an advantage it being possible to limit the scope to just one
repository, and to be independent of any of the developers working on
the project.

To use it, a [personal access token][creating a personal access token]
needs to be created usnig the `sea-bot` account, with `repo` access
scope, and the `sea-bot` user granted "Write" access to the
repository. These are inserted into the Google Script's properties as
described above.

**Changing Properties**: I have found that the Script Properties tab
only allowed new properties to be added the first time I used it.
Subsequently there seemed to be no means to add or modify the
properties!  However, I was able to work around this by modifying the
script to add a function which setting the properties via
the [Properties Service API][], and running that.

Having set the properties, select the menu item *Edit -> Current
project's trigger*. This will open a new browser tab containing a
panel called "Triggers".  This defines scripts which run on specific
events from the spreadsheet.

Click the "Add Trigger" button. In the dialog which opens, set 

- the function to run to be `WEBHOOK`
- leave deployment as "Head" and event source as "spreadsheet"
- set failure notification to be "immediately"
- set the event type to be "on edit"

You can then close this and the script editor window tabs. Edits
should now trigger rebuild!

In case it does not, check the Triggers console for logged errors,
and/or run the `WEBHOOK` function directly in the script console to
see if there are errors. Also check the Actions tab in the target
GitHub repository.

For help adjusting the exact content of the downloaded data, change
the URL used in the workflow configuration. You can define the sheet
to download, opt to include the CSV headers (you need these), and
select a particular range to download (you might need to do this if
the some columns contain sensitive data). See this thread for some
hints:

https://stackoverflow.com/questions/33713084/download-link-for-google-spreadsheets-csv-export-with-multiple-sheets

Also, investigate the validation options you can apply to Google
Spreadsheet data, which should help to avoid getting bad data, and may
make the sheet more user-friendly.

## Manual data collection

In this case, a user commits the new data file via the GitHub UI or
through a git commit using a Git client. 

The branch needs to be see up first.  Orphan branches may be most
suitable for manual addition of data files, because they do not need
any of the generic scripts in the master branch. Branching from the
master branch as above is possible, but will include the generic
files, which are not really needed.

An orphan branch (named `$newbranch` in this example) can be created
via the `git` command like this (assuming you have a shell console and Git installed):

    git clone $repo_url # from GitHub
	cd $repo_dir
    git checkout --orphan $newbranch
    git rm -rf .  # clears out staged files left from the master branch
    git add $newbranch/data.csv
	git commit -m "initial commit"
	git push # back to GitHub	

Once the branch exists with the initial data file committed, it's
relatively easy to commit a new version of this file, either via the
GitHub UI or the git command-line client. To do it via the git command
(using the same label `$newbranch`):

    git clone $repo_url # from GitHub
	cd $repo_dir
    git checkout $newbranch
    $EDITOR $newbranch/data.csv # edit or copy the new data into place somehow here
    git add $newbranch/data.csv
	git commit -m "new data... blah blah"
	git push # back to GitHub	

To do it via the GitHub UI, first the user needs an account on GitHub
with access to the repository.  Then they can navigate to
the [data-capture][] project, select the correct data branch in the
"branch" drop-down menu, and navigate to the directory containing the
data.

Then either select the "upload files" option in the "Add file"
drop-down to upload the file from their local filesystem (it must be
named `data.csv` - the same as the old one.) Or, click on the
`data.csv` to view it, and there is a pencil icon which will allow it
to be edited in the browser.

In either case, commit the changes with an informative commit message,
and this should be noticed the next time the [open-data][] processing
pipeline runs (assuming it knows about this data source, a topic
outside the scope of this document - contact a developer if you need
to check this.)


[creating a personal access token]: https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token
[workflow_dispatch]: https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#workflow_dispatch
[workflow_dispatch API]: https://docs.github.com/en/free-pro-team@latest/rest/reference/actions#create-a-workflow-dispatch-event
[download.yml]: .github/workflows/download.yml
[spreadsheet-trigger.gs]: src/spreadsheet-trigger.gs
[data-capture]: https://github.com/SolidarityEconomyAssociation/data-capture
[open-data]: https://github.com/SolidarityEconomyAssociation/open-data
[Properties Service API]: https://developers.google.com/apps-script/guides/properties
[Ben Collins article]: https://www.benlcollins.com/apps-script/oauth-github/
[sea-bot]: https://github.com/sea-bot
