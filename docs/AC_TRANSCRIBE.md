[00:00:00] imagine building your next startup with nothing more than a sentence this is
[00:00:06] Vibe an AI powered app builder that makes that possible and in this course
[00:00:12] you're going to learn how to build it yourself let's try it out by entering a
[00:00:17] simple prompt and hitting submit what you're about to see next is something you'd normally expect from
[00:00:24] high-end tools like Lovable Replet or Bolt but in this tutorial it is
[00:00:30] something you will learn how to build the result a fully functional Netflix
[00:00:35] style homepage generated entirely by AI we can explore the full app right here
[00:00:42] in the preview and everything just works the layout the interactions even models
[00:00:49] and favorites it doesn't just look like a Netflix style homepage it behaves like
[00:00:54] one and just above the preview there's a live URL you can open it in a new tab
[00:01:02] share it with others or test the app in a real browser environment and when
[00:01:07] you're ready to see exactly how it works simply switch to the code tab and explore every component utility and file
[00:01:14] that was created but how is this even possible and how does it all work let's
[00:01:20] break it down what you're looking at here is the inest developer server it
[00:01:26] shows a background task that kicked off as soon as we submitted our prompt the
[00:01:31] task itself is handled by an AI coding agent the agent has access to various
[00:01:38] tools used to build the app it can run commands in the terminal create read or
[00:01:44] even update files and its goal is to create a fully functional Nex.js JS
[00:01:50] application tailored to the user's request you can click into any step to
[00:01:56] see exactly what happened and when which packages were installed what commands
[00:02:01] were run and which files were created or modified finally the agent spins up a real
[00:02:09] development environment using an E2B sandbox a secure container that runs
[00:02:15] your app and exposes a live URL so you can preview and interact with it just
[00:02:21] like any deployed project and finally the finished app is saved to
[00:02:27] our Postgress database powered by Neon let's head back to our Netflix project
[00:02:34] for a second and just above the message form you will see that we have a message
[00:02:39] two credits remaining that's right each generation uses a credit so let's see
[00:02:45] what else we can build with this app and find out what happens when we spend our
[00:02:50] last point this time I will go with something a bit more interactive like a conbon board I
[00:02:58] can drag around and just like our previous project this one was created
[00:03:03] flawlessly i can drag and drop cards and even create new ones everything just
[00:03:10] works and just like our previous project I can visit the file explorer and see
[00:03:16] every line of code that was generated notice how I've got one more credit left
[00:03:22] let's go ahead and spend it right beneath our homepage we can find
[00:03:28] all of our previously generated apps or vibes as we are going to call them let's
[00:03:35] click into the first one just to confirm it is still live and working
[00:03:41] but now let's use our final credit to build something new this time I'm going
[00:03:48] to build an admin dashboard and I'm hoping to see some status cards and a
[00:03:53] pageionated table and here it is a sleek looking admin dashboard with status
[00:04:01] cards sidebar and a pageentated searchable data table notice how I have
[00:04:08] no more credits left meaning that when I try to generate a new prompt I'm going
[00:04:14] to get an error and it is time to upgrade in order to get more credits
[00:04:19] it's time to upgrade billing is powered by Clerk that's right just like their
[00:04:26] out system the developer experience is incredibly smooth no web hooks no
[00:04:32] complicated code no confusing Stripe setup everything works out of the box
[00:04:38] watch how quickly I can upgrade my account that's it i have upgraded and I
[00:04:44] am now on the premium plan and I can see my status reflected immediately in the
[00:04:49] user settings and as a developer you can now track your monthly recurring revenue on the
[00:04:56] clerk dashboard page after a successful upgrade you will see that you have a 100
[00:05:02] credits remaining and beneath them the exact time they will reset and by the
[00:05:07] way dark mode is fully supported in this project you can switch it on from the project's settings bar and it will
[00:05:14] immediately update the entire app's UI including the code explorer and the
[00:05:20] landing page this isn't just a coding tutorial we'll
[00:05:25] also be following a proper Git workflow throughout the project this will include
[00:05:30] creating commits new branches and real pull requests every pull request will be reviewed by
[00:05:37] Code Rabbit our AI reviewer that provides feedback on everything from
[00:05:43] logic issues to best practices all actionable insights and critical
[00:05:48] mistakes will be flagged automatically drastically improving our code quality
[00:05:54] let's quickly go over the text stack we'll be using next.js 15 with React 19
[00:06:01] make our framework with support for serverside rendering and server components trpc combined with fanstack
[00:06:09] query will ensure our app meets full stack type safety prisma OM with
[00:06:15] postgress provided by Neon will be our database solution tailwind version 4 for
[00:06:22] styling along with chats and UI for accessible and reusable components
[00:06:27] authentication and billing will be done by clerk while background jobs and agent
[00:06:33] tooling and agent networks will be done by ingest e2b for executing AI generated
[00:06:40] code in secure cloud sandboxes docker for generating custom sandbox templates
[00:06:47] open AAI anthropic or Grock depending on the model you choose to power your AI
[00:06:53] agents code Rabbit for AI powered code reviews and of course we'll deploy
[00:07:00] everything to production when it's finished and now without further ado
[00:07:05] let's get started in this chapter we're going to set up our Nex.js project confirm our
[00:07:12] environment get familiar with the file structure and versions of our project and set up our component library and
[00:07:19] finally create a GitHub repository for this project so let's start by setting
[00:07:25] up our Next.js project if you head to the documentation page of Nex.js and
[00:07:31] click on the installation tab you will find the system requirements the minimum
[00:07:36] Node.js version is 18.18 and these are the supported operating
[00:07:41] systems so first things first let's confirm we have a proper node version installed you can go inside of your
[00:07:48] terminal and you can run node-v and while you're here also confirm these
[00:07:54] two commands you should not be getting errors for any of these three if you get
[00:08:00] errors for any of them it is time to upgrade or reinstall your node you can
[00:08:05] do that by visiting the official Node.js website if you have a version which is
[00:08:10] lower than 18.18 you're going to have to upgrade as well keep in mind that if you
[00:08:16] are or Linux or some different operating system your versions of npm and npx may
[00:08:22] be different but as long as you're not getting any errors and you have a correct node version you are good to go
[00:08:30] so now let's go ahead and let's actually install our Nex.js application
[00:08:36] seeing here we have an automatic installation CLI command so I'm going to go ahead and copy it but I'm not going
[00:08:42] to run it immediately i will slightly modify it instead of using at latest I'm
[00:08:48] going to write the exact version 15.3.4 so instead of latest I'm going to do
[00:08:55] 1534 why am I doing this and do you need to do this the reason I'm doing this is
[00:09:02] because I don't know when my viewers will come across this video this might be a month from now 6 months from now or
[00:09:09] a year from now and depending on that there might be a lot of new breaking
[00:09:14] changes introduced in the latest versions so if you want to you can use
[00:09:19] the latest version that's perfectly fine but if you want to avoid any breaking changes meaning that you're watching
[00:09:26] this video far into the future like 6 months from now or a year from now and you just want to code along I'm giving
[00:09:32] you the option to use the exact version that I had at the time right so this is
[00:09:38] the latest version at the time of me making this tutorial so I'm going to go
[00:09:43] ahead and use this version i'm going to create a project called a vibe i'm going
[00:09:48] to select yes for TypeScript yes for slint yes for Tailwind and I'm also
[00:09:54] going to select yes for the source directory be careful here because I think that the default value might be no
[00:10:01] so use the arrow keys to select yes and press enter same thing for the app router make sure you select yes here yes
[00:10:08] for Turboac but only for nextdev in my case and I'm not going to customize the
[00:10:15] import alias so this will be the only no option for me and now let's just wait for our dependencies to install
[00:10:24] after our dependencies have installed you're going to see a success message like this what you have to do next is
[00:10:30] you have to enter this directory with your terminal so let's go ahead and do change directory vibe like this and once
[00:10:39] you're inside of here you can run the ls command to see a list of files inside before we run this project I want to set
[00:10:45] up our IDE the place where we are going to write some code for me that's going
[00:10:51] to be VS Code so I'm going to go ahead and select open and I will select my new
[00:10:56] Vibe project inside of here you should be seeing a
[00:11:01] similar or the exact same file and folder structure so first let's confirm
[00:11:07] our versions i'm going to go inside of package JSON you can see that I have Turboac here because I selected TurboAC
[00:11:14] yes you can see that I have React 19 you can see that I have next 15.3.4
[00:11:21] you can see that I use Tailwind version 4 and TypeScript version 5 and these are
[00:11:26] probably the most important versions for this project of course if you are watching this into the future and you
[00:11:33] want to use whatever are the newest versions for you you absolutely can you don't have to worry about this then I'm
[00:11:40] simply showing this for those people who want to use the exact same versions as me great so about the config files I
[00:11:47] have a tsconfig a post CSS config next config and an esllet config you might
[00:11:53] notice that Tailwind config is missing that is because we are using Tailwind version 4 which no longer introduces a
[00:12:01] Tailwind config inside of the source folder I have an
[00:12:06] app folder source folder is quite important make sure you have it so inside of the app folder here I have a
[00:12:13] favicon globals layout and page you can quickly visit them if you want
[00:12:20] to and inside of my public folder you can see that I have some SVGs here great
[00:12:28] so now let's go ahead and let's install Shats CNN UI into our project first of
[00:12:34] all let's mark these as completed now let's go ahead and set up Shatsen UI
[00:12:43] so by visiting chats UI and going into the introduction you can see that even though we are going to use it as our
[00:12:50] component library is actually not a component library instead it is how you build a component
[00:12:57] library it is basically a collection of open code components with composition
[00:13:03] pattern that you can simply add to your project so let's go ahead and go inside
[00:13:08] of the installation and select next.js let's pick our package manager here
[00:13:13] let's copy the command make sure you are doing this inside of your project so again you can run ls to confirm you are
[00:13:20] inside and once again instead of using latest I'm going to go ahead and show you which version I have so for me that
[00:13:28] is 2.7.0 so let's go ahead and run the command
[00:13:37] my apologies instead of latest 2.7.0
[00:13:44] in it if you get prompted to install you can select yes i'm going to be using neutral for my color here
[00:13:51] and there we go just like that we have initialized chats UI into our project here you can see how it verified the
[00:13:58] framework next.js and it valid validated the Tailwind config it found version 4
[00:14:05] perfect you can see that it also installed some dependencies modified our global CSS and created one file so we
[00:14:13] can now go ahead and visit all of those things here you can see that I now have CLSX
[00:14:19] Lucid React and I believe also Tailwind Animate CSS
[00:14:25] i think that's the new package that came from uh Shotsy UI and Tailwind merge is
[00:14:32] new as well I believe great so those are the packages that SHAT CN CLI added now
[00:14:39] let's go ahead and look at our lib file utils inside of the source folder in
[00:14:44] here we have a CN function which we're going to use throughout our project whenever we need to safely uh merge or
[00:14:51] add dynamic Tailwind classes and it also modified the globals.css
[00:14:58] by adding a bunch of variables which we can now use uh to build our project
[00:15:03] theme it also added dark mode rules as well perfect
[00:15:10] so now let's go ahead and let's learn how to add a component so for example
[00:15:15] let's go inside of our components here let's select a button component and
[00:15:21] let's go ahead and select CLI option for the installation and let's go ahead and copy this to clipboard and I'm going to
[00:15:28] use 2.7.0 add button and just like that we have added a
[00:15:35] component to our project if you get prompted with the option to use legacy
[00:15:40] peer depths or force uh you can select any of those two options but if you're
[00:15:46] using the same versions as me I'm pretty sure uh it will you will have the exact same experience it should just work
[00:15:52] straight out of the box but if you get any errors or any uh decisions to make
[00:15:58] you can select legacy peer depths if you don't have that choice perfectly fine you can just continue
[00:16:05] great so now you can go inside of source components UI and you can find button.tsx
[00:16:10] and you can see that it's using some of these new packages that it added before and it also uses the CN which it
[00:16:18] initialized before so the cool thing about SAT CNUI components is that they are open code meaning that it's not
[00:16:25] bundled in a Node.js package it is actually available for us to modify and
[00:16:30] build as much as we want so now let's go ahead and let's run our project
[00:16:37] so npm rundev you will see d- turbo pack here and then you can open the localhost
[00:16:43] 3000 to see your app now let's go ahead and let's modify
[00:16:49] source app page tsx so we can see some changes here
[00:16:55] go inside of page here and let's learn how to actually write a page component
[00:17:00] so I'm going to remove everything and the important thing here is that your components need to be uh using default
[00:17:08] export right so the name doesn't matter this can be called home or it can be
[00:17:14] called page i like to use the page convention and now in here I can just write hello world
[00:17:20] and once I save you will see the change hello world if this is your first time using Visual Studio Code if you have a
[00:17:28] little uh circle here it means the file is unsaved so just hit save and then it
[00:17:35] will be updated and here's what happens if you don't do a default export it will not be able to
[00:17:43] find the page so that's why default expert is important here but the name itself does not matter but of course you
[00:17:51] can't use some reserved uh things right you should not be able to call this
[00:17:56] error right because error is already reserved great so now let's go ahead and let's
[00:18:03] test out our tailwind so I'm going to go ahead and add a class name here text
[00:18:08] bold my apologies it is font bold i forgot
[00:18:14] there we go and now my font is bold but let's try changing the color text rows
[00:18:20] 500 and now I've changed the color you might notice that I have this little color
[00:18:26] icon and when I hover over my classes I can see the inner CSS it is applying if
[00:18:32] you want to see the exact same thing you can go ahead and install Tailwind CSS IntelliSense package it will be
[00:18:39] quite useful in this tutorial great now let's go ahead and let's remove this
[00:18:46] and let's add a button from components UI button let's go ahead and give it some children
[00:18:53] and let's close it and just like that you have a button
[00:19:00] here and now I'm going to show you a quick way you can enter the button inner code
[00:19:06] you can use command or control and then click here and that will take you to the
[00:19:11] actual source components UI button right
[00:19:17] so it will be quite useful for you to learn this shortcut because I will use it quite often in the tutorial so you
[00:19:23] don't get confused how I got there that fast another shortcut you should learn is command space my apologies command P
[00:19:32] or control P depending if you are on Windows and then once you open this bar
[00:19:38] you can search for button and press like this i'm going to be using this quite extensively in the tutorial so it would
[00:19:44] be good that you learn this as well so once you're inside of the button here you can see that we can have some
[00:19:51] variants like destructive let's go ahead and try it out
[00:19:59] once you add it you can see that the destructive variant is now uh active but
[00:20:05] what happens if you go inside of the code and change this to danger you can see how it immediately breaks
[00:20:12] and we have to change this to danger so what we've just done is we've changed the inner code of the button to our
[00:20:19] liking instead of destructive it is now called danger so let's bring that back
[00:20:24] now and let's try creating a new one so new and let's go ahead and try something
[00:20:30] fun like background purple 500 text white
[00:20:36] and if you go ahead and try now you will see that you have the new option and just like that you created your own
[00:20:42] variant so that's the power of Shatsen UI and now that we confirm the button is
[00:20:49] working let's go ahead and let's add all of the other components the reason I want to add all other components is so
[00:20:55] that it's easier to follow along in this tutorial you obviously don't need all of
[00:21:01] them and you can clean them up later but it's just going to be easier for us to have all of them at our disposal and
[00:21:07] then simply choose which ones we want to use instead of having to install and wait so I'm going to go ahead and shut
[00:21:13] down my app and I'm going to run npxhat cnui 2.7.0-all
[00:21:20] and this will add every single component to our project
[00:21:25] and you can see how it added all of these components but it skipped the button because it already exists perfect
[00:21:33] so now we can go ahead and inside of your source components UI you will see all of these various components here you
[00:21:40] now probably have a lot of unsaved files here my apologies not unsaved uncommitted files uh we're going to
[00:21:48] explore what that means in a second so let's go ahead now and let's do the last
[00:21:53] thing that we need which is create a GitHub repository so I'm going to go
[00:21:58] ahead and go inside of my GitHub and I selected new repository here now just a quick note you don't have to do this so
[00:22:06] yes following this step right here creating a GitHub repository branching
[00:22:12] out doing commits and opening pull requests it's completely optional it is
[00:22:17] simply for those who want to learn uh how to follow a proper Git workflow if
[00:22:23] that is not something of interest to you you don't have to do it at all right so
[00:22:29] I'm going to create a new repository called Vibe and I'm going to set it to private and I'm going to create a new
[00:22:35] repository here and then I'm going to go ahead and copy uh these three lines
[00:22:41] because we need to push an existing repository here but before we can do
[00:22:46] that we have to stage our changes so we have 53 unstaged changes now so let's go
[00:22:52] ahead and add a plus here and now all of them are staged and now let's add a
[00:22:57] commit message so I'm going to go ahead and do 01 setup basically my commit messages will match uh my chapter and
[00:23:05] then I'm just going to commit and then what we're going to do is we're going to go ahead inside of our project and we're
[00:23:11] going to run those three commands here wait a second and now if you go ahead
[00:23:18] and refresh your repository you can see that you have your project available right here and now in here you no longer
[00:23:25] have that button publish a branch because now you have access to your uh
[00:23:30] remote origin main meaning that this is no longer a local repository this is now
[00:23:36] a remote branch on a remote repository perfect so that marks the end of this
[00:23:43] chapter and now we are ready to start setting up our database amazing job and
[00:23:48] see you in the next chapter in this chapter we're going to set up
[00:23:55] our database we're going to start by obtaining a connection URL using a poser
[00:24:01] database provided by Neon we are then going to set up Prisma our OM we're
[00:24:07] going to learn how to add and modify a Prisma schema some basic migrations as
[00:24:12] well as how to use a database studio and also how to reset your database in case
[00:24:18] something goes wrong and then we're going to go ahead and branch out open up
[00:24:23] a pull request and review and merge that pull request so let's go ahead and visit
[00:24:29] Neon database you can use the link in the description or the link you can see on the screen to let them know you came
[00:24:35] from this video once you've created an account with Neon go ahead and click
[00:24:40] create project i'm going to go ahead and call my project Vibe and my database name will be Vibe as well and then I'm
[00:24:48] going to click the connect button and I'm going to copy the snippet for my connection string
[00:24:54] after that I'm going to go inside of my project and I will create a new file environment
[00:25:00] inside of here I'm going to create a database URL and I'm going to paste my connection
[00:25:06] string after that let's go ahead and let's set
[00:25:11] up Prisma you can use the link in the description or the link you can see on the screen to let them know you came
[00:25:17] from this video this helps me a lot in creating more content like this so let's
[00:25:22] go ahead and learn how to use Prisma with Nex.js the first step is to set up
[00:25:28] the project since we already have that we don't have to do that instead we can go immediately to step
[00:25:35] two install and configure Prisma since we are using other databases
[00:25:40] specifically Neon let's click here so we know what to install so let's go ahead
[00:25:46] and start by installing Prisma and TSX as our dev dependencies
[00:25:54] once this was installed I will just go ahead and go inside of my package json
[00:26:01] so you can see the versions right prisma is 6.10.1 and TSX is 4.2 20.3
[00:26:09] so if you're using the latest versions this probably does not matter for you but if you want to use the same versions
[00:26:16] as me you would go ahead and set up your installation like this for example
[00:26:23] if you want to great so after we've done this our next step is to install Prisma
[00:26:31] client but this time not as a dev dependency but as an actual dependency
[00:26:36] instead after we've done this let me show you the version
[00:26:45] prisma client 6.10.1 so I think the most important thing about the Prisma
[00:26:50] versions is that Prisma client needs to match your Prisma dev dependency at
[00:26:56] least at the time of me making this video I'm pretty sure that is an important rule it might change in this
[00:27:02] in the future so I'm not sure but I think it was this way for a long time now so now let's go ahead and let's
[00:27:09] actually run our app so in here they have this snippet but I'm not sure if
[00:27:14] this exact output will work with our directory because we have a source file
[00:27:20] here so instead what I'm going to do is I'm just going to run npx prisma init with nothing more so npx prisma init
[00:27:29] let's go ahead and run this and after this was finished I see this
[00:27:36] big log here so your Prisma schema was created in Prisma/sema.prisma
[00:27:45] prisma would have added database URL but it already exists in your environment
[00:27:52] you already have a g ignore file don't forget to add environment in here so pretty good warnings here so yes every
[00:27:58] time you run npx prisma in it it creates an environment file or it modifies it
[00:28:04] and it adds a database URL but this time it detected that we already have a
[00:28:11] database URL inside of our environment so it didn't do anything right usually
[00:28:17] it would modify your uh uh environment file and it would write a big message at
[00:28:24] the top saying modified or generated by Prisma but the only thing you need in your environment is the database URL so
[00:28:31] even if yours looks different maybe in the future they've changed this all you need is a database URL for now great so
[00:28:39] now let's go ahead and let's visit the other things added inside of Prisma
[00:28:45] folder we now have a schema.prisma and what's important here is that your provider is posgress and that your URL
[00:28:53] is the database URL so make sure you don't have any typos here but if you got
[00:28:58] this warning message it means you have typed it correctly because it did not
[00:29:03] override it and yes about this second message uh don't forget to add
[00:29:08] environment in the git ignore file that is very important but as you can see my
[00:29:13] environment file is grayed out which actually means it is inside of git ignore you can find it right here
[00:29:22] great so now that we have that set up let's go ahead and learn how to modify
[00:29:28] the schema so I'm going to go ahead and I'm going to copy this exact changes that they are using in their Prisma if
[00:29:35] you don't have access to that documentation page for whatever reason don't worry i'm just doing this as an
[00:29:40] example our schema will be different anyway or you can just pause the screen and type it out now so basically we're
[00:29:46] adding a user model with an ID of type integer and it will auto increment
[00:29:52] basically if I add one user it will be ID1 and then I add another user it will
[00:29:57] be ID2 then an email string which is required and unique and a name string
[00:30:04] which is optional so basically Prisma is using decorators
[00:30:10] for stuff like defining a primary key or ID in this case or adding the default
[00:30:16] value or setting something to be unique and if you want to make a field optional
[00:30:21] you simply add a question mark after its type and if you want to make a relation
[00:30:26] like user and post you start by defining well obviously your database structure
[00:30:32] one to many many to many right uh and then you simply add how you want it to
[00:30:38] be architectured so I want user to have many posts but I want post to have only
[00:30:43] one user so you define the second model and you literally say it's an array of
[00:30:49] that model right and then inside of here in order to properly connect it using
[00:30:55] foreign keys what you have to do is you have to set the author ID or the user ID
[00:31:01] and then you have to create an actual relation using the foreign key so you have to use user as the model and then
[00:31:09] you use a decorator relation so it matches the outer id and it references
[00:31:14] the ID of the user model and this is the place where you would add things like on
[00:31:20] delete cascade right so in case the user gets deleted we want the model post to
[00:31:27] get deleted as well so you can remove this for now just leave it exactly like this this is like a pretty good minimal
[00:31:33] example to learn Prisma and one thing I forgot to tell you yes you can install
[00:31:39] Prisma uh here to see the syntax i should have told you this before my
[00:31:45] apologies i just remembered uh so make sure to install this right so you can see the pretty colors and everything
[00:31:52] and once you've done this make sure you save this file and let's go ahead and see how do we actually you know commit
[00:31:58] this right because right now uh our database here is completely empty
[00:32:03] nothing yet exists here nothing is pushed here so let's go ahead and let's do npx prisma migrate dev i'm not going
[00:32:11] to do this flag because that's not how we're going to uh run our commands so npx prisma migrate dev and now we're
[00:32:19] going to be asked to uh call this migration in a certain way
[00:32:27] so I'm going to call this migration in it and just like that we applied the
[00:32:32] migration and two things have happened now actually three things the first
[00:32:38] thing is that it synchronized our database from neon to the schema right
[00:32:43] so now uh our neon database has the same schema there uh the second thing it did
[00:32:49] is it created a migrations file instead of our project and the third thing it did is it generated the Prisma client
[00:32:56] instead of source generated Prisma right so let's try and check all of those things out uh if you go inside of your
[00:33:02] Prisma you can now see the migrations here and inside of here you can see the actual SQL file that happened
[00:33:10] uh and the second thing you can see is I'm not sure where is my uh generated
[00:33:18] it's right here source generated there we go you can see the Prisma is now available here and the third thing that
[00:33:24] it did is it synchronized the Neon database so if you go inside of neon uh and if you go inside of tables I think
[00:33:32] you might be able to see there we go post and user right so you can see uh
[00:33:38] the exact fields here title content published author ID and user relation ID
[00:33:45] email name and posts relation there we go so we officially synchronized all of
[00:33:50] those things now so let's go ahead and see the next steps that we have to do uh
[00:33:56] in here it suggest creating a seed script let's go ahead and do that right
[00:34:02] I'm going to copy this you don't have to do this but I think it's nice it's a nice way to learn Prisma let's go inside
[00:34:09] of Prisma and let's create a seed.ts script like this and let's paste it
[00:34:14] inside now in here I have to go inside of source I think
[00:34:23] let me just see how do I access this
[00:34:28] all right found it so it's source generated Prisma right we have to go
[00:34:33] inside of source generated Prisma it's not inside of app like they suggested
[00:34:40] here perhaps uh this depends on whether you use the source folder or not or
[00:34:45] they've changed it so they use the prisma dot user create input now if
[00:34:50] you're wondering where does this come from how does it know user create input
[00:34:55] why is this called user well that's actually the magic of Prisma every time
[00:35:00] that you modify the Prisma schema and you run the proper command npx prisma
[00:35:07] migrate dev which internally runs npx prisma generate
[00:35:12] what basically happens is that it refreshes its internal uh intellisense
[00:35:18] typescript tool if I can call it like that and it creates a bunch of these useful types for you so right now you
[00:35:25] also have things like Prisma uh you can see all these weird things if I I think
[00:35:32] I can you I can import user and I can import post right and if I were to add a
[00:35:37] new model I would be able to import that as well right so that's the cool thing about Prisma uh perfect so I have this
[00:35:44] user data here and let me just if you if you are not unable to copy this let me
[00:35:50] just show you this first example and all the other ones are exactly like that and
[00:35:55] this is the bottom part right uh or you can use the link that I will put on the screen uh for this seed
[00:36:02] script if you want if you are unable to find it great so now let's go ahead and
[00:36:09] let's add this to our package JSON so Prisma and seed
[00:36:14] Let's go inside of package json so after scripts here let's add Prisma
[00:36:22] seed tsx Prisma SLT seed.ts just ensure
[00:36:27] that yours is in the correct place and once you've done that and saved the
[00:36:34] file uh in here we have a warning before starting the development server note
[00:36:39] that if you're using Nex.js JS version 15.2.0 or 15.2.1
[00:36:45] do not use Turboac right so you can see that Turbopac sometimes has this small little issues but since we are on a
[00:36:52] newer version we should have no problems here right uh and now let's go ahead and
[00:36:57] run npx Prisma database seed here like that and that uses the tsx Prisma
[00:37:06] seed and there we go the seed command has been executed so just make sure you have tsx installed in your dev
[00:37:12] dependencies and your seed command set at the correct place and you should immediately be able to see this if you
[00:37:18] go inside of your neon database and if you go inside of your users you will see Alice and Bob inside of the users here
[00:37:25] so we successfully populated our database perfect another way of seeing this data is by using the Prisma Studio
[00:37:33] so NTX Prisma Studio should open it up on 555
[00:37:39] and there we go you can see that inside of here I have some posts and I have some users
[00:37:47] right here Alice and Bob perfect let's see what are the next steps here so now
[00:37:54] we have to learn how to actually uh fetch our data right so let's go ahead
[00:38:00] and do that i'm going to go ahead inside of my project inside of source inside of
[00:38:07] lib and I'm going to create a database.ts file so they recommend creating Prisma i like to call it
[00:38:13] database and I'm going to import Prisma client from generated Prisma this is the
[00:38:19] same thing that they are doing i'm just using an alias here and then you literally have to do the same thing here
[00:38:28] i'm going to go ahead and try and explain uh how this works so basically
[00:38:35] why not just export new Prisma client the reason why is because of Nex.js hot
[00:38:41] reload uh every time a hot reload happens a new Prisma client gets initialized and that causes problems and
[00:38:48] you would actually see a warning in your terminal about that so what they do is they store Prisma in a global because
[00:38:56] global as the window object is not affected uh by hot reload
[00:39:04] i used window object i'm not sure if this belongs to the window nameace perhaps node namespace would be a better
[00:39:12] descriptor of it and I also don't like to use the export default so I will just use the export const here and let me
[00:39:19] just put it here actually I have to do it like this okay
[00:39:26] so now that we've done that let's go ahead and let's uh try and query
[00:39:31] something so I'm going to go inside of my source folder inside of app page.x
[00:39:38] and I'm going to go ahead and import prisma from lib database right here and
[00:39:46] I will get my users from await which means I have to turn this into an asynchronous component prisma dot user
[00:39:56] and let's just use find many and then I'm going to remove this entirely and do
[00:40:02] JSON stringify users null and two and we can remove the button import so this is
[00:40:09] a server component by default meaning that it is rendered on the server and it
[00:40:15] has access to the database server component is not the same thing as server side rendering those are two
[00:40:22] different concepts a server component is actually a react thing not a next.js
[00:40:28] thing next.js is simply the environment where server components can be demonstrated so let's go ahead now and
[00:40:35] do npm rundev let's visit localhost 3000 and in here
[00:40:42] you should see a JSON of your users inside and if you change this to post
[00:40:48] and change this to posts you should be able to see posts here as well so that
[00:40:56] is basically it right in here they go a bit more in depth they're creating a whole you know unique include we're
[00:41:04] going to learn that through the project itself so that's basically it for this but there is one more thing I want to uh
[00:41:11] go over here so we added the schema we learned about basic migrations and we learned about database studio but we
[00:41:18] didn't learn about database reset so why do we even need to learn about
[00:41:24] database reset well I just think it's very useful for development so let me go
[00:41:30] ahead and actually modify this so for development right not for production
[00:41:35] cases right you would pretty much never need to reset your database in production but during development it's
[00:41:42] just super easy if you get stuck right because this is the case now so we now have some posts and we have some users
[00:41:50] right so what happens if I go ahead now inside of my schema Prisma here and for
[00:41:56] example I remove the title from the post it's no longer required or I remove the
[00:42:02] email right and if I go ahead and do that now so npx prisma migrate dev i'm
[00:42:08] going to add this changes now uh it will probably ask me to reset database anyway
[00:42:14] right uh that's why this is a dev command right it should this should also not be used in production
[00:42:22] you would usually do npx prisma migrate you can learn more about that uh in the
[00:42:27] actual Prisma documentation here and there we go so now we have a problem you are about to drop the column title which
[00:42:34] still contains nonnull values and you're about to drop the column emails are you
[00:42:40] sure you want to create and apply this migration i'm going to select yes and I'm going to call this test migration
[00:42:46] here uh and this time it worked right so this seems to be uh normal now but the
[00:42:53] problem is what if you do something more complicated for example let's try and let's drop the user here and let's drop
[00:43:01] this right i'm trying to make a scenario uh where this actually stops working
[00:43:08] right let me try this
[00:43:14] i'm going to do another migration and I'm going to call this test again
[00:43:22] test two and okay it's still working never mind basically my point is that
[00:43:29] you need to learn how to nuke your database let's say that you do some some
[00:43:34] of your own experiments here and you get to a point where you're getting errors with your npx Prisma migration what I
[00:43:41] usually do if I get completely stuck and I'm in development this is important
[00:43:47] only for development mode i would go inside of Prisma here and I will remove all of my migrations all of them and
[00:43:55] then I would do npx prisma migrate reset like this
[00:44:01] are you sure you want to reset your database all data will be lost and I will press yes right so uh oh yes
[00:44:11] um I forgot that resetting it also runs the seed script so let's remove the seed
[00:44:16] script because it doesn't make sense right we just use it to learn so we can remove that we can go inside of our
[00:44:21] package JSON and we can remove this and we can also go inside of our source
[00:44:27] app page and we can remove this as well
[00:44:37] and then let's go ahead and just confirm that we can do npx prisma migrate reset
[00:44:42] again so just confirm and this should clear
[00:44:48] your entire database basically this is quite useful in
[00:44:54] development mode when you are for example doing what we just did right we just learned how to use Prisma so we
[00:45:00] populated our database with some models we don't really need we don't need the user with name optional and email
[00:45:09] required and posts right there there's not going to be any posts in our project so we just learned how to reset our
[00:45:15] database as well perfect so now it's time to create our first pull request
[00:45:24] once again uh the part of git workflow of this tutorial is completely optional only for those who want to learn so you
[00:45:30] can end the chapter here uh if you don't want to follow the git workflow so what I'm going to do is I'm going to go ahead
[00:45:37] down here where it says main and I'm going to click create new branch and I'm
[00:45:43] going to call this 02 and then I'm going to call it database so I'm going to call
[00:45:48] my branches according to my chapter 02 database and you can see that down here it says 02 database then I'm going to go
[00:45:56] ahead and click the plus icon to add all of these changes and then I'm going to go ahead and add my 02 database commit
[00:46:03] message and after that I'm going to publish my branch and once I've done that I'm going to go
[00:46:10] back to my GitHub here and immediately you will see an option to create a pull
[00:46:15] request in my repository if this did not appear for you you can manually go inside of pull requests new pull request
[00:46:23] the base will be main or master depending on what you're using and you're going to select your new branch
[00:46:30] here in the compare and then create a pull request and then click create pull
[00:46:36] request right here and once you've created your pull
[00:46:41] request you can go inside of file changes here and in here you can see every single thing that was modified you
[00:46:49] can see that we added the Prisma client instead of our lib database we slightly
[00:46:54] modified our page tsx and we added the schema prisma we installed some new
[00:47:00] packages and we also added uh source generated prisma to get ignore so that
[00:47:05] was not added and after that we can go ahead and merge this pull request and click confirm merge uh I'm not going to
[00:47:13] delete my branch simply so I have access to all of my branches here you can see that I can now always go back to that
[00:47:19] state of the application and then what you have to do inside of your project is the following go uh down here and click
[00:47:28] on the 02 database branch and then you have to select your main branch you
[00:47:33] might be wondering which one this main or this main well basically the
[00:47:39] difference is one is a local branch and the other one is a remote branch so the
[00:47:44] remote branch would be the one that is most uh well I I would say that is the
[00:47:50] source of truth i could be wrong in doing this because you could have some changes on your main branches that you
[00:47:57] didn't push but in our case we're going to push everything from the main branch so in your case it doesn't matter if you
[00:48:03] click on this one or if you click on this one you will have the exact same result what's important is that you do
[00:48:10] the following uh you click on synchronize changes here and then okay
[00:48:16] like this and now you should no longer have any uh visible buttons here right
[00:48:22] and if you go inside of your graph you should see this an initial commit then 01 and then something different for 02
[00:48:30] right because we branched out and then we merged that back into our main like
[00:48:36] that and now if you go ahead inside of your main here you can see that six minutes ago we merged this right uh
[00:48:45] perfect so that's it for this chapter you can now see that even though I'm in my main branch I still have my Prisma
[00:48:52] schema meaning everything is fine everything is good perfect so let's go
[00:48:57] ahead and wrap this up so I'm going to go ahead and uh
[00:49:03] check this as done amazing job and see you in the next chapter
[00:49:09] in this chapter we're going to set up TRPC which is going to be our data access layer let's go ahead and let's
[00:49:17] head to the TRPC documentation page you can use the link in the description or the link you can see on the screen to
[00:49:23] let them know you came from this video once you are on the landing page go
[00:49:28] ahead and click on the docs and in here click on the client usage and in here
[00:49:34] you can find tanstack react query with a little star icon and in here going to
[00:49:40] server components be mindful that at the top here you do have a nex.js tab but
[00:49:47] that is talking about an older nex.js version so make sure that you are inside
[00:49:54] of tanstack react query server components this is what we need the
[00:49:59] first thing we have to do is install all the necessary dependencies so if you're watching this video far into the future
[00:50:06] I would recommend waiting until you see the exact versions that I had installed
[00:50:11] so before you run this what I suggest you do and what I suggest you do before you start any of my chapters is click on
[00:50:19] this button right here and just click okay basically this is just a sanity
[00:50:25] check to confirm that you are on your main branch and that you didn't accidentally uh forget to synchronize
[00:50:32] your merged branch from the previous chapter so you only care about this if you are actually following the git
[00:50:38] workflow once you've done that and you are confirmed to be on the main branch you
[00:50:44] can go ahead and install all of these packages i am going to show you which versions exactly I have installed
[00:50:52] let's head into package.json so we can see all the changes here
[00:50:58] as you can see I have tenstack react query 5.80.10 and all tRPC versions are 11.4.2
[00:51:08] so if that's something you care about you can go ahead and install these
[00:51:13] versions as follows you would add this exact number to all of these packages
[00:51:20] regarding TRPC and then you would change this from using the latest version to using
[00:51:27] 5.80.10 and the ones for ZOD client only and
[00:51:35] server only are not that important but I'm going to show you them as well so server only is 0.0.1 0.1 and zod is a
[00:51:43] package we already have installed and we had it installed in the first chapter setup because when we added all chats
[00:51:50] component we also added forms and forms in chaten use zod for validation so
[00:51:57] that's why this isn't marked as a new dependency because we already had it great so now that you have confirmed to
[00:52:04] installed all TRPC ones just double check that you actually have the same versions of all TRP PC packages because
[00:52:12] that is quite important right so the version here is the the important
[00:52:17] version here is 11.x right the minor versions probably don't matter that much
[00:52:23] but there is a big breaking change in uh 11 if you're coming from 10 or 9 so make
[00:52:29] sure you're using at minimum 11 something and then you're good to go perfect now let's go ahead and let's
[00:52:36] create a small init file here uh so I'm going to copy this uh it's a very simple
[00:52:43] snippet so even if you don't have access to this documentation page don't worry i will pause the screen and you will be
[00:52:49] able to copy with me let's create a TRPC folder inside of our source folder and
[00:52:54] inside let's create init.ts and in here we are importing init TRPC
[00:53:00] from TRPC server package and cache from React we are setting up the create TRRPC
[00:53:06] context here with some mock information and we are also creating our initial T
[00:53:13] object which is basically initializing the TRPC and then we are extending it to create the router callers uh and factory
[00:53:20] and base procedure perfect so that's our init file
[00:53:26] now let's go ahead and scroll a bit down and let's create our base routers
[00:53:31] so I'm going to go ahead inside of TRPC I'm going to create routers folder and inside app.ts
[00:53:41] so I'm importing Z from zod and from the previously created init file I'm
[00:53:46] importing the TRPC router with the base procedure so in here we have a very simple procedure called hello and it
[00:53:53] accepts text which is a string and it returns back an object with a property
[00:53:59] greeting which is a string with the information from the text that we've entered we are going to test this out
[00:54:06] later so it's easier for you to understand if this is the first time seeing the TRPC syntax
[00:54:12] so that's it for the routers and now what we have to do is we have to create
[00:54:17] our API folder DRPC and then a special uh Nex.js variable folder uh and then
[00:54:24] route.ts so let's do that first inside of source app folder let's create
[00:54:31] API then let's create tRPC and then let's create a dynamic folder inside of square
[00:54:37] brackets TRPC again and then route ds
[00:54:43] and let's go ahead and copy this now in here we're going to get some errors it's specifically uh about this import alias
[00:54:51] so we don't use uh this curly little string instead we use an add sign so you
[00:54:56] can just switch it to that and you will have no more errors as you can see uh all of these things already exist so we
[00:55:02] have the TRPC server package they are just extending it here some tree shaking it seems and the TRPC in it is the one
[00:55:11] we just created as well as the router's app right so you can commandclick on this to visit that same as the init one
[00:55:18] and this is a NodeJS package so that's a different thing great you can save this
[00:55:23] as well just double check that you have app folder API TRPC TRPC in square
[00:55:29] brackets and then route.ts it's very important to have this exact structure
[00:55:37] great once we've done that let's go ahead and let's create the queryclient.ts
[00:55:44] so I'm going to go inside of source drpc queryclient.ts
[00:55:53] yes it is.ts perfect so about super JSON we can um let's do this let's
[00:56:00] immediately install it so super JSON because we are going to need it and I will go inside of my package JSON here
[00:56:07] so this is my version in case you want to use the exact same one and what we're
[00:56:12] going to do is we're going to immediately enable serialized data using superjson.s serialize and des serialize
[00:56:19] data using superjson ds serialize as well so you can leave it the component
[00:56:25] like this no need to modify anything further now let's go ahead and let's create our
[00:56:32] client.tsx so this will basically be a wrapper a provider of TRPC and Tstack query which
[00:56:40] we're going to wrap our entire app around uh if this is your first time ever seeing Tanstack query or TRPC this
[00:56:47] is a lot of information at once uh but if you've ever worked with uh React
[00:56:53] Query or something like SVR I promise it's a similar API it is just uh a bit
[00:57:00] more advanced data access layer format that we are doing here so as much as
[00:57:06] this setup seems a little bit complicated it is definitely worth it you will see how easy it will be to
[00:57:12] build your API routes and your procedures later on you will thank yourself for going through this because
[00:57:19] of how easy it will be to maintain this project going forward right so just stay
[00:57:24] with me i promise it will be worth it so let's create client.tsx inside of here client.tsx
[00:57:33] so this extension is important because this will be exporting a component so since this is a bit of a larger file I'm
[00:57:40] going to go ahead and explain what it is so first of all we are adding use client because this has to be a client
[00:57:45] component you can see it tries to access the window here and it's also using some
[00:57:51] uh hooks like use state that can only be achieved using a client component that's
[00:57:56] why we are using use client at the top and you can also see the explanation here so we are importing all of those
[00:58:02] things we should not have any errors because we either created or installed these packages
[00:58:09] so one thing that we are going to change is this so I don't like how this is specifically tailored for Versell
[00:58:15] because I don't know where you want this deployed so don't worry i'm going to show you how you can modify this so it
[00:58:21] works well regardless of where you deploy so let's go inside of our let's just
[00:58:29] save the file uh and let's go inside of environment here
[00:58:35] and let's simply add next public app URL and this will be the following when you
[00:58:43] go ahead and do npm rundev you're going to see where your app is being run so go
[00:58:48] ahead and copy this and simply paste it inside then I always like to copy from here and
[00:58:56] then paste it rather than type it out because you can do some typos if you're not careful and you can see how
[00:59:02] complicated this is right so it recognizes Versell URL and then it has to append the protocol and then it has
[00:59:08] to add this because Versel URL doesn't have the protocol otherwise it has to guess that we are using the 3000 port
[00:59:15] it's just completely unnecessary we can do this much easier you can return this completely and instead of using this you
[00:59:22] can just do process environment next public app URL so then when you deploy
[00:59:28] you will simply change this to your production URL regardless of where you deploy and this will work just fine and
[00:59:34] in my opinion it's much simpler to work with and this is important right you can
[00:59:39] see that this will attempt to load the URL from localhost 3000
[00:59:45] /trpc so it's important that you didn't do any
[00:59:51] changes herec that's why this structure is important
[00:59:56] and then in here we just have some regular uh trpc and uh tanstack query
[01:00:02] setup but we have to enable the transformer superjson because we did enable it here so we have to enable it
[01:00:10] here as well so let's do the following at the top here i'm going to import superjson from super JSON and I'm going
[01:00:18] to go down here remove this part and simply uncomment so we are using the
[01:00:23] super JSON and you can ignore the error for now it's because we need to enable it in some other places as well to get
[01:00:29] it to work so once you've done this we didn't do any changes besides
[01:00:35] this and this right that's the only thing we changed so now as per their
[01:00:42] instructions we have to go ahead and wrap this in the root of our application when using Nex.js since we are in Nex.js
[01:00:49] JS let's go inside of the root of our application and that's inside of the app folder layout so in here simply go ahead
[01:00:58] and wrap the entire application so be careful with the component you are
[01:01:04] importing it is TRPC react provider from TRPC client the reason I'm telling you
[01:01:10] to be careful is because there are similarly named imports from packages we
[01:01:16] are not importing from any npm package if you need to be able to command or controlclick here and it should lead you
[01:01:23] to this exact component which has this little superjson error that's the one we
[01:01:28] need to import and wrap our application around because if you just do TRPC provider you can see that that also
[01:01:34] exists but that's the incorrect one right it's TRPC react provider from TRPC
[01:01:40] client component that is currently throwing the error that's the one we need
[01:01:46] once you've done that we have to create a server.tsx and this is where things become
[01:01:52] interesting so let's just do that now i'm going to go inside of DRPC and I'm going to create server.tsx
[01:01:59] and I'm going to paste this here and you can immediately delete this part so this is just an example if your router is on
[01:02:06] a separate server not case for us so we can remove this so you can see it's much simpler now again we have all of this
[01:02:13] either installed or already created great so now that we have that uh let's
[01:02:20] go ahead and just fix this little super JSON uh issue here that I'm having
[01:02:28] so I'm using super JSON in client.dsx i'm using it in queryclient.ds
[01:02:35] and I think I should also be using it in init.ds you can see that I have it commented out
[01:02:41] here so let's enable this and let's import super JSON from super JSON this
[01:02:48] basically helps with serialization when it comes to passing specific props from server to client components with complex
[01:02:55] objects right like well object array date things like that super.json helps
[01:03:00] sparse those things uh great so we now created server.dsx
[01:03:07] and this is actually a very very uh interesting file and I'm going to try
[01:03:12] and do my best to explain why so that is basically it for the setup we are now ready to use this API so let's go ahead
[01:03:20] and let's do that in here I think they've added the most complicated example so I'm going to try and use a
[01:03:26] more familiar example first let's go inside of source app folder and let's go
[01:03:32] inside of page.tsx and let's try and do the following let's add TRPC
[01:03:39] using use TRPC from naturally client right that's our client.tsx
[01:03:46] component this is where we import everything client related so now we have access to TRPC you can
[01:03:53] see that I can find my hello and I can go ahead and pass in the query options inside i can find the greeting or the
[01:04:01] text and I can say hello right this isn't doing anything now i'm
[01:04:08] just showing you the API and how it works so let's just quickly go inside of
[01:04:13] our routers here so you can see this change in real time and so I can give you a little tip if it doesn't change
[01:04:19] for you so go inside of TRPC routers app and rename this from hello to for
[01:04:25] example create AI something like that you can see how immediately I've gotten
[01:04:31] an error here because that's how TR the RPC works so instead of having to do localhost 3000 / AI slashcreate
[01:04:41] dash AI right which is most of the time a literal string right so it's very hard
[01:04:47] to u it's very easy to make mistakes right i can accidentally do this and this is now an invalid API route but I
[01:04:54] wouldn't know until I see a 404 error so what the RPC does is it enables full
[01:05:00] stack type safety from start to end so if I accidentally make a mistake here it
[01:05:05] immediately throws an error like this route doesn't exist that's what the RPC is
[01:05:12] and it is much easier to build your apps when you know that you can rely on your code rather than having to see it break
[01:05:19] in production and then go and fix it right so if it works inside of your IDE
[01:05:24] if there are no errors here it will pretty much work everywhere that's the power of having uh end to end type
[01:05:31] safety and let's go ahead and change one more thing inside of this input here this basically represents things you can
[01:05:38] send to your API so let's go ahead and imagine an API post request again for
[01:05:45] example this would be create AI in here we would send something like body and then we would somehow you know stringify
[01:05:52] this with text hello right this is a stupid example right but you know what I
[01:05:57] mean uh this is also very easy to break but in here you can see that if I try
[01:06:02] sending a number here I'm getting an error why because we clearly defined this needs to be a string so if I change
[01:06:09] this to uh number now you can see that it works right but if I try string it
[01:06:15] will break So what happens if you are not being able to see the same result as
[01:06:21] me right when I hover over text I can see the text is a type of number when I hover over create AI I can see the input
[01:06:28] and text number and output is a greeting of string right exactly as I'm typing it
[01:06:33] here if you are seeing type any for everything you could be having a problem
[01:06:40] with your setup so what you can do is you can go uh inside of extra
[01:06:46] information and go into frequently asked questions and here we have it it doesn't
[01:06:52] work i'm getting any everywhere so there are a couple of things you can do the
[01:06:57] first thing is you can check your tsconfig.json and in here make sure you have strict
[01:07:04] true enabled the second thing is to make sure that you are using the proper TypeScript version and make sure your
[01:07:11] editor is using the same TypeScript version as package JSON so for me none of these things were ever an issue but I
[01:07:18] did have this as an issue and this is what actually fixed my types so go
[01:07:23] inside of your VS Code settings.json let me just go ahead and try and do this
[01:07:30] so settings let me Oh I think that yeah you can just
[01:07:37] create it if you want to so go inside and create a VSS code like this and then
[01:07:44] settings.json and you can paste this inside and then you can click allow if this happens and
[01:07:52] let me go back to page.tsx so nothing changed for me because this worked from the start but if you're having any
[01:07:59] problems when I say any I mean this you're getting the type any all over
[01:08:04] your project it could be due to these missing settings so this actually fixed my problem once so that's why I am
[01:08:11] sharing it with you and you can always do commandshiftp and then reload window
[01:08:16] and this kind of restarts the TypeScript server so then it could work maybe great
[01:08:22] so now let's actually see the result of this query so make sure that you have your app
[01:08:29] running and that you can visit uh your root page and first thing you should see is this very big error why because by
[01:08:38] default in Nex.js every page and component is a server component unless
[01:08:43] specified differently or if it is a direct child of a client component so
[01:08:50] let's go ahead and add use client to the top this will then turn it into a client
[01:08:55] component and you can see we no longer have these errors we can now use hooks as much as we want so what I want to do
[01:09:01] now is show you how we actually get data from our API using a very familiar use
[01:09:07] query from the package 10stack react query and in here you would usually
[01:09:12] create you know your own fetch method which would then call forward slash AI
[01:09:19] create AI and then you would pass in the body right and you would have the JSON
[01:09:24] stringify blah blah blah what you can do now is the following you can just use the TRPC oneRPC
[01:09:32] create AI and pass in the query options inside text and let's try Antonio here
[01:09:38] let's go back inside of Yeah you can also commandclick here and it will take you directly to the router so I'm going
[01:09:44] to change this back to string and then what we can do is simply render data
[01:09:53] let's just do JSON stringify data there we go and there we go greeting hello
[01:09:59] Antonio if I change this to John it will change to hello John that's how we're
[01:10:07] going to fetch our data this is our data access layer great so this is the most
[01:10:13] simple way of fetching data using a client component right everyone knows this but let's go ahead and cover two
[01:10:19] more examples which I think are important right so we've kind of set up the RPC and we experimented with a
[01:10:26] client component now let's experiment with a server component and then finally let's experiment with pre-fetching and
[01:10:32] I'm going to try to explain what it is and why it is important so basically server components have
[01:10:39] several advantages over client components uh they are not of course one is not a replacement of other they work
[01:10:46] together but server components have that advantage that they are well on a server which means server components have
[01:10:52] direct access to the database for example but in our case what's important is that they render sooner than client
[01:11:00] components right so what is currently happening is that our application has to
[01:11:05] wait for page.tsx to be rendered from the server and only then does it start
[01:11:12] fetching the data but what if we could start fetching the data on the server
[01:11:19] and then continue using the data using this familiar API within a client
[01:11:25] component that is prefetching but in order to understand pre-fetching let's first remove use client like this and
[01:11:33] let's break our app so immediately our app is broken right we can't use tRPC here at all
[01:11:40] right so now what we have to do is we have to learn how to use TRPC inside of a server component and let me just show
[01:11:46] you uh I'm going to try and do this so if I add console log here
[01:11:52] and just remove these things and just refresh I think that you should be seeing server component inside of
[01:11:59] your terminal how come you're seeing it in the terminal because it is a server component right because if I change this
[01:12:06] to use client now and change this to client component and refresh I'm pretty
[01:12:14] sure we can still see it here yes this is a bad example my apologies previously
[01:12:19] in the past you could not see it if it was a client component uh so yeah ignore
[01:12:24] this i tried to do an example but I used a wrong one let's just learn how to
[01:12:30] fetch data from a server component so in here we actually have some guides let me
[01:12:35] just go back here there we go so uh in here getting data
[01:12:41] in a server component so let's go ahead and simply create this little caller
[01:12:47] inside of our server.tsx so go inside of tRPC server.tsx
[01:12:53] and at the end here export const caller call the app router create caller create
[01:12:59] trpc context right so there is a way you could you know fetch data from a server
[01:13:04] component and that would be either you know directly calling the database like
[01:13:10] calling Prisma or there is nothing stopping you from fetching inside of a
[01:13:17] server component so you could again do create AI and then the body blah blah
[01:13:23] blah right but that is unnecessary overhead because server component already has access to the database right
[01:13:30] no point in doing this that's why TRPC has invented something called a caller
[01:13:36] so what you can do now is let me just confirm the API you can import the caller so let's just do that so I'm
[01:13:43] going to do cons data and turn this into an asynchronous server component component and await caller from DRRPC
[01:13:51] server create AI and let me just see do I have to do it like this i have to
[01:13:56] Antonio server and then I believe let me just check is
[01:14:02] it data like this there we go json stringified
[01:14:09] data so this is how you would fetch from a server component using TRPC using a
[01:14:16] caller so this isn't doing a network request on the server component this is server component literally directly
[01:14:24] having a remote procedure access a remote procedure protocol to TRPC that's
[01:14:29] why TRPC is so powerful because I think it's one of the only RPCs available that
[01:14:35] has these types of callers i could be wrong but it's the only one I've seen that performs this well and this isn't
[01:14:41] so impressive right now but if you've worked with server components before and you tried any kind of RPC here you would
[01:14:48] almost always encounter an issue that you lose authorization headers right uh
[01:14:54] the server component would never know if the user is logged in or not trpc solved
[01:14:59] that problem as well that's why I love TRPC so much because it allows us to leverage server components so now let's
[01:15:07] finally do the uh way we are going to use the RPC and that is using
[01:15:12] pre-fetching so we would do things like this const query client would be get
[01:15:19] query client from gRPC server we're not going to call the caller here but we
[01:15:25] will import tRPC from here and then in here we're going to do void t uh
[01:15:31] queryclient dot prefetch query drpc create ai query options text
[01:15:41] Antonio and this time prefetch
[01:15:46] and then in here what we would do is we would add a hydration boundary from
[01:15:52] tanstack react query we would pass the state to be dehydrate
[01:15:58] again imported from tanstack react query and pass in the query client and then in
[01:16:03] here we would render a client component
[01:16:08] so let's go ahead and create that client.tsx this is not a reserved keyword so this
[01:16:15] is just a component which needs use client at the top and then in here what
[01:16:22] we would be able to do is the following we can now get the data by using use
[01:16:27] suspense query from tanstack react query and let's add
[01:16:34] our TRPC from the client and pass in TRPC create AI query options and
[01:16:41] important you need to have the exact same text here otherwise the
[01:16:46] pre-fetching will fail because this would usually be some kind of filter for example instead of text you would most
[01:16:53] likely have page one limit 10 so if you prefetch one thing and then expect to
[01:16:59] have something in suspense in the client component it wouldn't work that's why it is super important that your query
[01:17:06] options are exactly the same in your prefetch and in your client component
[01:17:11] and then in here you would be able to do JSON stringify data
[01:17:16] and now let's go ahead and let's do this so let's go inside of here let's import client
[01:17:23] from dot /client and let's wrap this inside of suspense from react
[01:17:31] and let's add a fallback here loading so what's going on here
[01:17:39] basically instead of directly calling the data inside of a server component what we are
[01:17:46] doing is we are leveraging t uh we are leveraging tanstack queries cache and
[01:17:52] state and we are immediately populating it the moment server component gets
[01:17:58] created the moment server component loads because this will then allow the
[01:18:04] client component to load whenever it loads because we know a server component will load sooner than client component
[01:18:10] but this time the client component won't have to wait until it gets loaded and
[01:18:16] only then initiate a network request instead it will already have the data
[01:18:22] ready even though because we prefetched it inside of a server component and it's
[01:18:29] very important to use a void here and this prefetch query actually doesn't return anything so even if you tried
[01:18:35] things like this this wouldn't work it doesn't return anything they've done that on purpose so you don't uh so you
[01:18:43] don't actually use this data because pre-fetching query all it does is it
[01:18:48] initiates a call on a server component but only for the sole purpose of populating
[01:18:54] uh tanstack query which can then be accessed in a client component so we are
[01:19:00] leveraging server component to start fetching our data immediately and then
[01:19:06] we are passing it down to the client component which uses a familiar API so
[01:19:12] because this is use client we can now go ahead and have a use effect here right we can go ahead and we can have a state
[01:19:20] here right we can do all of these things and it would work as fast as if we did
[01:19:27] the entire thing in a server component so we don't lose the familiarity of client components and we also don't lose
[01:19:34] the speed of server components we basically get the best of both worlds by
[01:19:39] doing this and let's finally try it out you can see it works just fine i know
[01:19:45] this is still a bit confusing i try to explain it the best I can i would highly suggest you know reading about
[01:19:51] prefetching and just going through uh this documentation in the first place
[01:19:57] perhaps Dave explained it a bit better but this is how I like to explain it basically we are now getting the best of
[01:20:04] both worlds both the speed of server components and the familiarity of client
[01:20:10] components and I think that this officially uh
[01:20:15] marks the end of this chapter right so let's just remove these things because we don't need them and what we're going
[01:20:21] to start doing in the next chapter is finally initializing our uh background
[01:20:27] jobs and start introducing some background actions we now have our database we have our OM and we have our
[01:20:34] data access layer so those are the three things that we need so we can start saving uh some data in our database
[01:20:41] properly right so let's go ahead now and mark this as completed we did all of
[01:20:48] these things and let's go ahead and branch out now so I'm going to go ahead and go down here and create a new branch
[01:20:56] i'm going to call this 03 DRPC setup i'm going to go inside of my source control
[01:21:03] here and I'm going to stage all changes and then I'm going to add 03 TRPC setup
[01:21:12] comment and I'm going to commit and then I'm going to uh publish the branch
[01:21:19] then let's go ahead to our GitHub to open a pull request so in here compare and pull request and
[01:21:28] let's create a pull request and as you can see I have something that
[01:21:36] you probably don't in your pull request and that is an AI code review using code
[01:21:44] rabbit as you can see not only do I have a complete summary of this pull request
[01:21:50] as you can see we introduced TRRPC integration for type safe API calls between client and the server and we
[01:21:57] also added some chores not only that but I have a change file by file summary so
[01:22:03] you can see exactly what I did in each file and I also have a sequence diagram
[01:22:09] explaining exactly how every single component works in which order and how
[01:22:16] it responds with data and result which is especially useful if this is your
[01:22:21] first time working with the RPC and Tanstack query and I also have some potential issues it
[01:22:30] caught for example we added this dummy TRPC context from the documentation
[01:22:36] right so it noticed that and it told me that I should replace this hard-coded
[01:22:41] user ID with proper authentication in this exact case it is okay for us to
[01:22:47] proceed because this is just uh our initial TRPC code we will replace this
[01:22:52] later when we add authentication but you can see how it already started noticing some potential issues in our code and
[01:23:00] then it also told us to change this further on when we update this React context so it actually understands our
[01:23:08] code very very indepth if you're interested in having the exact same code
[01:23:15] review you can use the link in the description or the link you can see on the screen and create a Code Rabbit
[01:23:21] account but that is not all so now I'm going to go ahead and merge this right
[01:23:27] here let's merge this pull request i'm not going to delete my branch simply
[01:23:34] so I have access to it right here so this was our previous chapter and now we have TRPC setup and you can see that I
[01:23:41] got this popup in my Visual Studio Code as well asking if I want to start a
[01:23:46] review inside of my Visual Studio Code so since I just reviewed my code uh in a
[01:23:53] pull request I'm going to click no but I'm going to show you in a second what this is so before we proceed go ahead
[01:24:00] and make sure you change back to your main branch and then just click on this
[01:24:06] little button to synchronize the changes and then when you click on a graph here
[01:24:12] you should see our last one was a database commit and then we merged that and now we branched out for TRPC setup
[01:24:19] and we merge that back inside and what I suggest you install is Code
[01:24:26] Rabbit extension so Code Rabbit is a completely free VS Code extension you
[01:24:32] can go ahead inside of your extensions here Code Rabbit and install it and if
[01:24:38] you don't want it connected to your pull requests you can have complete free code
[01:24:44] reviews in your Visual Studio Code all you need is an account with Code Rabbit
[01:24:50] you can use the link you can see on the screen and you will get amazing pull request reviews but also you will get
[01:24:56] completely free code reviews in your IDE we're going to try that in the next
[01:25:01] chapter because we just reviewed our code in a pull request this time so again just confirm you are on your main
[01:25:08] branch and you have synchronized all changes and that will allow us to continue to the next chapter so let's go
[01:25:14] ahead and mark this as done amazing job we now have the database access our ORM
[01:25:22] and our data access layer we are finally ready to start doing some AI related
[01:25:27] things and background jobs amazing amazing job and see you in the next chapter
[01:25:34] in this chapter we're going to learn all about background jobs we're going to learn how to add them to an Nex.js GS
[01:25:40] application and we're going to learn what they are and why we need them in
[01:25:46] order to understand that let's first look at a normal example imagine a login
[01:25:51] form you enter your email your password you click login we send a network
[01:25:56] request and we get an instant response success or fail we've already seen this
[01:26:02] a million times but now imagine you have a more complex task at hand imagine you
[01:26:08] offered your user an ability to generate a summary of a very very long YouTube
[01:26:15] video imagine my videos for example they are sometimes 12 24 hours long
[01:26:22] so this time we send a network request and in order for our backend to generate
[01:26:28] this summary it can take well over 30 seconds to do that because just imagine
[01:26:33] everything that needs to happen we first have to download the YouTube video then
[01:26:38] we have to transcribe the video and only then can we send that to an AI model to
[01:26:44] generate the summary so depending on the size of the video depending on the AI model you will use and depending on your
[01:26:50] overall infrastructure it can take well over 30 seconds for that to finish and
[01:26:56] if you have a task that's running for so long within a normal network request like this one you know something
[01:27:03] completely normal you risk your user never getting the result so the problem
[01:27:09] is not that the user has to wait the problem is this network request can time
[01:27:14] out the user can accidentally close the tab or the user can lose their
[01:27:19] connection if any of these things happen the user will never get the result back and we have to start the entire process
[01:27:26] again that's why we have something called background jobs so let's imagine this again the user clicks generate
[01:27:34] summary this time we send a network request again but instead of using our backend to generate the summary we use
[01:27:41] our backend to invoke a background job and the moment we've done that we are
[01:27:47] finished with our network request which means that we immediately return back to the user and say the summary is being
[01:27:54] generated and the user can now close the tab they can go for a run they can do whatever they want what's actually
[01:28:02] happening is that the moment we invoke a background job the background job now
[01:28:07] runs in a separate environment independent of the user's session
[01:28:12] independent of the user's connection right and we can simply notify the user when we are done this is the structure
[01:28:20] you have to understand if you want to build AI apps because depending on the model you will use and the complexity of
[01:28:26] the app you will build most of your tasks will be longunning tasks
[01:28:32] we will achieve this in our project using ingest so let's go ahead and
[01:28:38] create our first function and let's trigger a background job from nextjs
[01:28:44] you can use the link you can see on the screen or the link in the description to let them know you came from this video
[01:28:50] and once you're here you can immediately go inside of the documentation select NextJS
[01:28:57] and select app router here and then let's go ahead and install inest
[01:29:03] before you do that just make sure that you are on your main branch and you can click synchronize changes just to
[01:29:10] confirm uh you didn't have any unsaved changes here you can see my last chapter
[01:29:15] was TRPC setup and yours should be as well so I'm going to shut down my app
[01:29:21] now and I'm going to do npm install injust
[01:29:27] and now that I have this installed let me quickly show you my package JSON so you can see the version that I'm using
[01:29:35] once you have installed Injust the second step is to run the Ingest developer server
[01:29:43] the version that I will be using is 1.8.0
[01:29:48] but you can see that in here they simply target the latest version so when you
[01:29:54] see me now doing this npx inest- cli at latest the latest is equivalent to 1.8.0
[01:30:04] zero just in case you were interested in my exact version so npx inest- cli at
[01:30:13] latest or a specific version and then dev and when I start this you can see
[01:30:18] that it says injustdev server is online at localhost 8288
[01:30:23] and if I visit the project here well you can see that not much is going on here it is a developer server but nothing is
[01:30:31] here for us to do so what we have to do now is we also have to have our app
[01:30:37] running so let's do mpm rundev and in here you will start to see something you
[01:30:43] will start to see a bunch of 404 pages here that is because the ingest
[01:30:49] developer server is trying to find our inest initialization in our project but
[01:30:55] since we haven't done that we just have a bunch of 404s so let's go ahead and continue with the documentation here
[01:31:03] i'm going to go ahead and create an ingest folder and then put a client.ts
[01:31:08] inside with this simple code snippet so let me go ahead here inside of source
[01:31:16] and I will create a new folder called inest and I will create client.ts
[01:31:22] and I will paste this inside i'm going to call this vibe project or vibe
[01:31:28] development something like that basically the name of your project here and once you've
[01:31:34] done that you should oh actually not yet sorry so this is the first step and then
[01:31:41] we come to the second step which is creating an API endpoint for ingest so
[01:31:46] you can copy this snippet as well and go inside of app API create a new folder
[01:31:52] ingest and inside go ahead and create route ts
[01:31:58] and paste this inside and you and replace this with an add sign and a forward slash there we go it's basically
[01:32:06] using this inest which we just created and the moment you save this file if you have named it correctly and put it in
[01:32:12] the API folder you should go here and you will see that now you finally get 200 here because it
[01:32:20] finally found the ingest integration and now it will only try to hit that
[01:32:26] endpoint instead of all of these other ones great but we still don't have anything
[01:32:33] useful in the developer server here so let's go ahead now and let's continue
[01:32:39] by creating the first ingest function so I'm going to go here inside of source
[01:32:44] ingest functions.ts and create a new function so inside of
[01:32:50] ingest folder in the source make sure you don't accidentally do this inside of API inest so in here create functions
[01:32:58] whoops functions ds
[01:33:03] import the client and a simple hello world in just create function we give this an ID we give this an event name
[01:33:10] and we have a very simple step which waits for 1 second and it then returns a
[01:33:17] dynamic string which uses the data we can pass to this background job so this
[01:33:22] is an example so they show us how easy it is for us to pass some data to this background job this would be for example
[01:33:29] a link to a YouTube video we want to summarize right that's what this data
[01:33:35] object would hold for example I think I have a typo in my functions here so let me just fix that and then let's go
[01:33:42] inside of the app folder API inest route and inside of here let's import hello world from that inest functions file and
[01:33:51] now if you go back here you should be seeing uh your app here
[01:33:57] available auto detected you can see everything is fine it found it at API inest framework next.js and one function
[01:34:07] found hello world because we just added it here so if I rename this to hello
[01:34:12] world 2 it immediately renames here as well and now instead of these functions
[01:34:19] let me just refresh so it's back to this name i can now click invoke here and you probably have empty data but you can go
[01:34:26] ahead and add email and pass in I don't know it it can even just be the name it
[01:34:31] doesn't matter and click invoke function and you will see how it went from ceued to running to completed so that's the
[01:34:38] status that just happened it happened very quickly because uh there wasn't no no no one there was no function before
[01:34:46] this so the queue to running went very fast and the running only took 1 second because we only wait for 1 second for
[01:34:54] example let's now increase this to 10 seconds and save the file and let's go inside of
[01:35:01] our functions invoke and let's click this again you can see how now it keeps
[01:35:08] running it's running for 5 seconds 7 seconds and finally after 10 seconds
[01:35:15] it's finished is this getting familiar to what we just discussed this is a
[01:35:21] background job the only problem so far is that we are not invoking this
[01:35:27] function from our network request we are manually clicking on invoke here how do
[01:35:32] we invoke this from in our case TRPC procedure let's go ahead and let's do
[01:35:38] that so I'm going to go inside of source trpc
[01:35:44] routers_app and in here I'm going to call this invoke this will be base procedure and
[01:35:52] let's add an input here z.object and let's pass in the text to be z dot
[01:36:00] string like this and then instead of dotquery let's add dot mutation this
[01:36:07] time it's going to be asynchronous here let's extract input from here
[01:36:15] like this and this time what we're going to do is await inest from injust client
[01:36:25] the name of the function you can find here this is the name of
[01:36:31] the function you will run so pass that here and then you pass in
[01:36:36] the data and the data can be anything you want but we know that we accept email here uh so let's go ahead and pass
[01:36:44] email to be input.ext because we defined it as text here and
[01:36:50] this is how you invoke a background job from TRPC so now let's go ahead and
[01:36:56] actually use this invoke method i'm going to go inside of source at folder
[01:37:02] and I'm going to go inside of page.tsx here and uh well we already have this
[01:37:10] set up but since we are not going to need it I'm going to delete it for now i'm going to delete this client.tsx
[01:37:17] i'm going to go back inside of the page here and I will simply return a div here
[01:37:23] test and I will remove everything from here we only use this to learn about the
[01:37:29] RPC so let's mark this as use client so this becomes a client component the use
[01:37:35] client is very important for our demonstration here so please do it now when you refresh on your local host 3000
[01:37:42] you should just see a test here so now let's go ahead and let's create a padding for maximum width 7 XL MX auto
[01:37:52] and in here let's add a button component invoke background job
[01:38:01] and there we go we now have a button to invoke a background job so let's go
[01:38:06] ahead and add TRPC here use TRPC
[01:38:12] and let's add invoke from use mutation from tanstack react query pass in
[01:38:19] tRPC.invoke and pass in the mutation options here
[01:38:26] and then in here on click call invoke
[01:38:32] and call mutate and pass in the text to be test or John
[01:38:41] something like that so what I want to demonstrate to you now
[01:38:46] is how quickly this background job uh lasts in comparison to the network
[01:38:52] request so I'm going to go ahead and open my developer console here i'm going to go inside of the network tab and I
[01:38:59] will click invoke background job and let me just see did I even do anything now
[01:39:06] or not because I I'm definitely expecting to see something here but it is not uh
[01:39:13] happening let me refresh the page
[01:39:22] all right so my website froze so what I did was I simply shut down my app and I
[01:39:29] did npm rundev again so I'm hoping to try it out again this time successfully
[01:39:37] there we go now when I click on invoke a background job you can see how quickly
[01:39:43] this finished let's just see 468 milliseconds that's how long this
[01:39:50] network request took but we know that the actual background job took 10
[01:39:56] seconds so that is what we wanted to achieve if I go inside of the RPC invoke
[01:40:02] again uh and inside of the ingest and go inside of the functions let's change
[01:40:08] this to 30 seconds and add a comment here you know imagine this is a u
[01:40:15] download step right here in here we are downloading a video then in here imagine
[01:40:20] this is a transcript step another 10 seconds and
[01:40:26] then finally you know imagine this is a summary step and this finally then takes
[01:40:34] 5 seconds this is what we want to achieve right the moment we click on
[01:40:40] generate summary we send a network request we trigger a background job and
[01:40:45] we immediately allow the user to close the tab right so let's try it again uh
[01:40:51] in order if you want to you can also do this you can go inside of your layout
[01:40:56] in app folder and you can add a toaster
[01:41:01] from components UI soner like this i just like to order the
[01:41:08] components like so and now once you've added the toaster you can go inside of the page here go inside of mutation
[01:41:15] options and add on success here and you can add toast from soner.su
[01:41:22] success background job started
[01:41:29] and now you will see the following if your app gets stuck you can go ahead and just do mpm rundev again uh I did get
[01:41:37] this happen a few times and I think I solved it when I removed the turbo pack but we'll see basically if your app
[01:41:43] hangs on loading don't worry you can just uh restart it it will not happen in the actual app so let's try this now uh
[01:41:51] we can also do disabled here and let's do invoke is
[01:41:57] pending like that and we can also go inside of
[01:42:04] invoke function here the RPC invoke and after a wait let's return
[01:42:11] okay success like this so now if you click invoke
[01:42:19] background job you can see this is it the request is finished right the user
[01:42:25] can now close their tab and what's happening is in the background right we
[01:42:31] are now doing the first step which would be 30 seconds of downloading a YouTube
[01:42:38] video after that we're going to go ahead onto the second step right which would
[01:42:44] be transcribing a video so let's see after 30 seconds here is finished we go
[01:42:51] to the second step and this step will last for 10 seconds because we just wait
[01:42:57] for transcription to happen and then finally we have a third step and in here
[01:43:04] we would do the AI summarization and that's it hello John or this would
[01:43:10] actually be the summarization right so that is how background jobs work and
[01:43:15] that's how you add them uh in a Nex.js environment right and it doesn't matter
[01:43:20] if the user lost their internet connection it doesn't matter if they're closed the tab because the moment they
[01:43:27] invoke a background job the background job has started they can lose their
[01:43:32] internet connection obviously in development mode if you lose the internet connection your dev server
[01:43:37] would fail so yes in development technically you need you cannot really
[01:43:42] shut down your laptop but in production it will run on a separate server in a
[01:43:48] separate environment right and from this inest developer server you can easily cancel things if you don't want to you
[01:43:54] can rerun them uh you can go ahead and look at the payload that was added you can do a bunch of things here uh and one
[01:44:01] cool thing about ingest steps is this will later be of course more complex
[01:44:07] things than just sleeping for 30 or 10 seconds this will be API calls database
[01:44:12] requests and if they fail it is crucial to well retry them and that is what
[01:44:18] inest does automatically for you uh they actually have a cool example on their landing page here they have uh and yes
[01:44:27] they have agent kit this is something I didn't want to talk about immediately because I don't want to confuse you
[01:44:33] right so uh alongside background jobs we're going to use injust to build autonomous agents right so AI and
[01:44:40] background jobs go hand in hand and Injust is the platform to do both of
[01:44:45] that but I first want to introduce it through background jobs because it's easier to understand right and in here
[01:44:51] they have three very cool examples so this is the transcription example you can see that uh they have a step called
[01:44:59] transcribe video so it's very similar to step.slip slip but instead it is step.run
[01:45:05] and they call it transcribe video and in here they simply return a deepgram SDK
[01:45:11] with a function to transcribe a video URL and once this steps finishes they
[01:45:17] call an LLM chat GPT uh GPT4 to create a
[01:45:22] summary so exactly what we did so this would be the two steps right this would be the first one you know transcribe the
[01:45:29] video and then the second one summarize the video right I just use a download
[01:45:34] step as well so looks like we don't need a download step right so this is what you can use in just for the second one
[01:45:40] is to build AI with automatic retries cach caching and improved observability
[01:45:47] right so it's way more powerful than I can showcase in this short chapter
[01:45:53] that's why We will have more chapters later on to build the actual agent networks agent router and agent tools
[01:46:01] right and of course you can do sleep which right now seems only for fun but
[01:46:06] sleep can be very useful for example you can send a welcome email to a user then wait a week and then send a follow-up
[01:46:13] email so yes that's how long these tasks can wait they are background tasks uh
[01:46:21] perfect yes and for development you don't need any account yet but later uh
[01:46:26] for production for deployment we're going to have to create an account with ingest but for development there's going
[01:46:32] to be no need for that as well and I think that's great because we can get started right away just by running this
[01:46:39] perfect so I think that was the goal of this chapter i think we achieved this
[01:46:44] exact thing right here so we set up
[01:46:49] inest let me just change the color so we've set up inest we created the first function we explored the ingest
[01:46:56] developer server and we triggered a background job from Nex.js now let's go
[01:47:01] ahead and branch out and push this to GitHub so let me see this chapter name this is 04 background jobs so I'm going
[01:47:10] to go ahead and click here you can see that I have 10 unsaved files and I also
[01:47:16] have this little database in the inest folder if you're wondering what that is I'm just guessing it's cache for the
[01:47:21] inest developer server and now I'm going to go and click on the main here i will click create new branch
[01:47:28] and I will do 04 background jobs
[01:47:34] after I've done that I'm going to stage all of my changes and I'm going to create a commit message
[01:47:42] and I'm going to click commit and then you can see that code rabbit extension
[01:47:47] if you remember from the previous chapter uh you can install this a completely free AI code extension which
[01:47:54] allows you to review all of those files so let's go ahead and review all of
[01:48:00] these files and while this is doing its own thing which is most likely a
[01:48:05] background job on its own so you can see uh you can see background jobs every day
[01:48:10] right you probably just didn't know they were called background jobs while that is going on let's go ahead and let's
[01:48:17] create a new pull request inside of our repository here so let me go inside of pull requests here uh new pull request
[01:48:26] uh oh looks like it won't push until uh this reviews so I'm going to go ahead
[01:48:32] and review first actually it will i just have to click
[01:48:37] publish branch yes I forgot to click that so make sure you click publish branch and you can see that this is
[01:48:42] still doing its own thing in the background and I think now that we have a new branch there we go i forgot to do
[01:48:49] that my apologies so now we're going to have two uh AI reviews here one is going to be from here and the other one is
[01:48:55] going to be from here and you can see how cool it is that it can add comments
[01:49:01] on my code locally here in my There we You can see fox fix duplicate
[01:49:09] step ID so it noticed that all of my steps are called wait a moment uh which is very you know not useful uh when you
[01:49:17] were reading inside of the ines developer server so it already detected that for example so you can see how cool
[01:49:24] it is and it also fixes some wrong things here payload mismatch with ingest
[01:49:30] function this is of course not something that uh we need to fix right now simply
[01:49:36] because this is a demo but it is very useful as you can see it detects pretty
[01:49:42] much everything so if you don't want it here in your pull requests you can have it here in your uh IDE
[01:49:53] and here we have our pull request summary which is pretty much identical
[01:49:58] as you can see uh to the reextension for
[01:50:04] Visual Studio Code you're going to see in here we have fix duplicate step ids
[01:50:09] and you can see that here at the bottom I have the exact same issue here so you
[01:50:15] can choose which one do you like more do you like your pull request reviewed or
[01:50:20] do you want to submit clean pull requests by having this run before you
[01:50:26] push a pull request so in here I'm going to read through the pull request simply
[01:50:32] because we have the summary here so we introduced an API endpoint to handle background jobs using inest we added a
[01:50:39] button on the main page to trigger a background job with real-time toast notification on success we use this to
[01:50:47] visually measure how quickly the network request is finished in uh comparison to how long the background job actually
[01:50:54] lasts right and this is what I like the most i like the sequence diagram because
[01:51:00] it is exactly what we discussed in the beginning of the chapter so the user
[01:51:06] clicks on invoke a background job we send the invoke mutation with the text
[01:51:12] and then our TRPC router which is our network request simply sends the event
[01:51:19] with that data this can basically read as invoke a background job and the
[01:51:26] moment we do that we can send back the user okay success so this part right
[01:51:34] here is identical to what I wanted to achieve here the user clicks we send the
[01:51:41] network request we forward the data to a background job and we immediately respond to the user so they can close
[01:51:48] the tab and move on and the fun thing about this background jobs is the way
[01:51:55] Code Rabbit just reviewed my 10 files here is by using a background job they
[01:52:01] definitely didn't have a network request which went on for 30 seconds they had a
[01:52:07] background job which did this exact thing so I went through this potential
[01:52:14] changes they are all very correct but since this was just a demonstration it
[01:52:19] makes no sense to fix them right now because we will remove the whole page entirely uh in the first place right so
[01:52:27] we are good to go with merging this pull request right here i'm not going to
[01:52:33] delete my branch simply so I can go back to this part whenever I want uh and
[01:52:40] let's go ahead now right here let me close this let's go
[01:52:47] back to our main branch let's click this and let's synchronize our changes and
[01:52:53] after that I'm going to click no on this i'm going to go inside of my source
[01:52:59] control on the graph and you can see that I have 04 background jobs now
[01:53:05] merged right here and you can see that I'm on the main branch and I should have
[01:53:10] access to my inest folder here which basically means we fixed all these
[01:53:15] things perfect i'm also not going to do uh anything regarding this code rabbit
[01:53:21] uh comments here simply because all of this was just a demonstration amazing amazing job let's go ahead and
[01:53:28] mark this as complete now and see you in the next chapter when we
[01:53:34] are going to extend the use of our background jobs with AI amazing amazing
[01:53:39] job in this chapter working to implement AI
[01:53:45] background jobs in order to do that the first thing we're going to have to do is
[01:53:50] choose our AI provider in here I have added a list of all the options that we
[01:53:57] have and some comments for each of them starting with the best choice which is
[01:54:04] Open AI it is by far the most reliable the most normal rate limit with a fast
[01:54:12] reset and a very very good coding model this is the coding model that I have
[01:54:19] chosen GPT4.1 and it is almost perfect the absolute
[01:54:26] best coding model though is cloth specifically set 3.5 or 4 they are kings
[01:54:35] of coding models the problem with anthropic is a very strict rate limit
[01:54:42] and when you hit the rate limit it will take you longer than 24 hours for that
[01:54:47] rate limit to reset so it's it is just very very annoying to work with if you
[01:54:54] want to you can choose anthropic but you will almost certainly hit a rate limit
[01:55:00] and you're going to have to either change the model or create a whole new organization and account so basically
[01:55:07] Anthropic allocates their resources to uh higher paying customers right which
[01:55:13] are this very very large companies so it's not exactly suitable for tutorials
[01:55:18] as per Grock or XAI I'm not sure i haven't worked with it it is on the list
[01:55:25] of the supported AI models so I don't know i won't recommend it and I won't
[01:55:30] tell you not to use it i I'm not sure and as for Gemini or Google the great
[01:55:36] thing about Gemini is the amazing free tier the biggest problem with it for our
[01:55:42] use case it is just not good for calling tools it will straight up be errors all
[01:55:48] around so because of that at this moment I just don't recommend it uh I've heard
[01:55:53] that Grock AI has free tier so I would rather you use Grock than Gemini so
[01:56:00] unfortunately at this point I cannot recommend Gemini it is okay for this
[01:56:08] simple chapter that we're going to do now but later when we use AI for the thing we will actually need to use it
[01:56:14] for it will simply not work so if you really need a free tier you can try and
[01:56:20] use Grock rather than Gemini the absolute best choice and the choice
[01:56:25] that I will be using is Open AI specifically this model as I said there
[01:56:30] is a chance we might hit the rate limit here but the reset is around 2 seconds
[01:56:36] which is completely fair and it will happen rarely only when we are doing some very very large uh tasks with
[01:56:44] Enthropic we get the amazing results it completely understands Nex.js ecosystem
[01:56:49] it understands what chats and UI is but once you hit a red rate limit and you
[01:56:54] will hit it very soon it is almost impossible to get rid of you will almost be stuck in a rate limit so in my
[01:57:02] opinion choose Open AI it is the simple best solution for this project if that
[01:57:10] is possible for you you will have the best uh experience using Open AI and now
[01:57:16] I'm going to show you uh how you can find if any changes have been made regarding this uh if you're watching
[01:57:23] this tutorial in the future so you can use the link in the screen uh again or link in the description to visit ingest
[01:57:31] and in here go to the documentation and then go ahead and find agent kit and in
[01:57:39] here go ahead and click on this support for openai anthropic and gemini or click
[01:57:46] on the models here so in here you will see all supported models as you can see
[01:57:53] open AAI anthropic Gemini and Grock as I said even though Gemini is supported
[01:57:59] here I just wasn't able to get it to work if you want to you can try but I
[01:58:05] wasn't able to get it to work anthropic worked amazingly especially the 3.5ET
[01:58:12] versions but the rate limits were very easily hit the Open AI I initially tried
[01:58:18] with 4.0 and I really was not satisfied with the results it's not that good but
[01:58:24] even though it's not on this list you can try 4.1 so that is confirmed i
[01:58:29] tested it myself and it works no problem and it's amazing not as good as
[01:58:35] Enthropic 3.5 but very very good and very reasonable rate limits so what we
[01:58:42] have to do next is we have to create our account in one of these providers i'm going to show you what I do with OpenAI
[01:58:49] and then you can do whatever you want to choose here in my case I'm going to go
[01:58:55] ahead to platform.openai.com you can use the link you can see on the screen or link in the description once
[01:59:01] you've created your account you're going to go ahead into settings
[01:59:06] once you are in the settings you're going to go into billing in here it is very important that you have a credit
[01:59:13] balance so maximum of $10 even less will
[01:59:18] be enough for you to complete this tutorial many times which will of course depend on how often you create uh new uh
[01:59:25] websites and uh apps with this project but I barely spent that amount and I
[01:59:32] tested pretty heavily once you have uh filled your account you can go ahead and
[01:59:37] obtain an AI key if you're using Grock or Gemini you have a free tier but as I said Gemini just doesn't work uh and
[01:59:45] Grock I'm not sure you can try so let's go ahead and let's create a new secret key i'm going to call this Vibe
[01:59:52] development i will use the default project and I will select all permissions and I will create the secret
[01:59:58] key i will then copy this key and then what we have to do is we have to add that to our IDE I mean to our project as
[02:00:06] always ensure that you're on your main branch and you can synchronize the changes just to make sure you're up to
[02:00:13] date as you can see my last chapter was background jobs so now what I'm going to
[02:00:18] go is I'm going to go inside of environment here and I'm going to create open AI here
[02:00:24] open AI API key and I will paste it inside like this if you're using
[02:00:30] something else let me show you how to add that so I'm going to go inside of the inest uh agent kit documentation
[02:00:37] here and here you have it environment variable used for each model provider if
[02:00:42] you're using OpenAI it is OpenAI API key if you're using Anthropic it's Enthropic
[02:00:49] API key if you're using Gemini it is Gemini API key or if you're using Grock it is XAI API key so make sure that
[02:00:58] you've added one of those here perfect now that you have done that let's go
[02:01:03] ahead and do the following uh go inside of the agent kit by ingest and go inside
[02:01:09] of installation and let's go ahead and install inest agent kit so I'm going to
[02:01:15] go ahead and install this and I'm going to show you the version
[02:01:21] once this has been installed I'm just going to go inside of the package JSON and show you the version 0.8.3
[02:01:29] that's the version I'm working with now let's go ahead and let's use the agent
[02:01:35] kit in order to do that I just want to do the following let's go ahead and do npm rundev and let's go inside of source
[02:01:42] app folder page.tsx and in here what I'm going to do is the
[02:01:48] following i'm going to add a simple input from components UI input and above
[02:01:54] this tpc methods I will add value set value and a simple use state from react
[02:02:01] make sure you import that i'm then going to give the input a value and on change
[02:02:07] a simple event calling set value and setting it to event target value you've
[02:02:15] probably done this 100 times and this will simply be uh it can stay invoke
[02:02:22] background job it doesn't really matter great so now let's go ahead and run npx
[02:02:29] inest cli latest dev simply so we have both our app and the dev server running
[02:02:36] and now let's go ahead and do the following let's go inside of our inest
[02:02:41] functions here and let's just remove this one leave this one for 5 seconds
[02:02:49] like this and change this to um let's just say input let's call it
[02:02:57] that and then I'm going to change this to be input as well actually I'm going
[02:03:03] to change it to be value so we control it from this input here i'm going to go instead of the invoke tRPC method so it
[02:03:10] is inside of routers here i will change this to be input i will change the input to be input
[02:03:18] well I just call that in a dumb way didn't I why don't we just call it value
[02:03:24] that would be better sorry so let's go inside of invoke change this to value
[02:03:29] input dov valueue and call this value and then make sure to save this file go
[02:03:34] back inside of the functions and change this to hello event data value
[02:03:40] so let me show you the changes again inside of the page we added use state and the input with value and set value
[02:03:47] we then added a control to this input with those fields and we modified slightly the invoke.mmutate to pass in
[02:03:54] the value to be the value from the state we then modified our TRPC router to
[02:04:00] accept value in the Z object and we've accepted we changed uh the ingests send
[02:04:06] to pass in value in the data object and of course we modify the function to
[02:04:12] read dot value and we removed an extra waiting step
[02:04:18] so now that you've done this let's go ahead and let's run our app on localhost 3000 and let's open our uh development
[02:04:26] server here so now I'm going to call this uh test value and I will click
[02:04:31] invoke background job and then in here in the running uh text I should see
[02:04:37] value test value here and in finalization hello test value so exactly
[02:04:42] what we pass here perfect that's a very good setup now that we have agent kit
[02:04:47] installed let's go ahead and do the following in the inest documentation which is outside of the engine agent kit
[02:04:54] you can find a very very simple example by going inside uh let me just find
[02:05:00] inest functions step and workflows AI interference here and in here where they
[02:05:08] show you agent kit for the first time uh they show you this very very simple uh
[02:05:13] way of doing it so this is what we're going to do I'm going to add the following import so let's now go inside
[02:05:20] of inest functions here and I'm going to add this
[02:05:29] agent agentic open AI as open AI and create agent from inest agent kit
[02:05:37] and then I'm going to go ahead and open this function it's already opened right
[02:05:43] so basically I'm going to now write inside of here you can leave this hello world this can be unchanged let's create
[02:05:49] a new agent like this so let me just show you this and you can
[02:05:55] remove this it is directly open AI right
[02:06:02] and you can remove the step here as well so instead of writer let's call this
[02:06:09] summarizer the name will be summarizer you are an expert summarizer
[02:06:18] you summarize in two words so something very obvious
[02:06:26] right a very easy task you can give it a model GPT40 if you're using Open AI and
[02:06:32] let me just remove the things I don't need for now let me remove the step from here since I don't need it so in here we
[02:06:40] open a summarizer agent like this and since I'm using open AI these are the
[02:06:46] models that I can use one of them is CH GPT40 if you import anthropic from here
[02:06:56] you can see that then you're going to have to choose one of these models so just pick the one you like and same is
[02:07:02] true for XAI or Gemini whatever you ended up using so now we have to find a
[02:07:07] way to invoke this summarizer with event data value
[02:07:14] and since you saw when I copied this import I had to fix the invalid OpenAI
[02:07:20] import because I've copied it from here right so it would be best if you follow
[02:07:27] the instructions for agent kit on the actual agent kit documentation again you
[02:07:33] can find it right here under agent kit i simply used this one because I thought it was a very similar example to what we
[02:07:40] discussed in the previous chapter with the summarizer right but I think it would be better for you to follow the
[02:07:46] agent kit documentation here because this is the one that is kept up to date constantly so please follow this one so
[02:07:52] you can again go inside of the agents here and you can find this exact thing we just did we created an agent we
[02:07:59] called it summarizer and we gave it uh a system prompt and then we gave it a model so we did that correctly now what
[02:08:07] we have to do is we have to run it so let's go ahead and do that right here
[02:08:13] i'm going to go ahead and add this summarizer summarizer.run
[02:08:19] like this and let's go ahead and learn what to type here so I'm going to go
[02:08:26] ahead and add summarize the following text
[02:08:32] and I'm going to open back so I can insert event data value like this and now let's
[02:08:41] go ahead and add a weight here and now we have access to the output here uh so
[02:08:48] let me just see i'm not sure if I know the API by default but let me try output
[02:08:54] first in the array is it uh like that i'm not exactly sure
[02:08:59] let's try and let's just say success okay here and let's rely on the console
[02:09:07] log or perhaps we can just return out the whole output like this maybe this
[02:09:12] would be easier to work with so we just created a very simple summarizer agent
[02:09:17] which is an expert summarizer and can summarize in two words we imported open AAI and create agent from inest agent
[02:09:24] kit new package that we have installed we specified a GPT40 model another hint
[02:09:30] here uh I mean just I'm basically just repeating what we previously went over
[02:09:36] make sure that your environment variables are properly set because as you can see we did not define the API
[02:09:43] and variable here so it will search for it itself so the name is very important
[02:09:49] but if you want to name it differently for whatever reason you can do that and I think that inside you can pass the API
[02:09:55] key and then you can call this you know API key if you want to or if it's not
[02:10:02] managing to find your environment variable for whatever reason let's try this out now so I'm going to
[02:10:09] go ahead um and honestly I don't know how this will perform so I'm going to
[02:10:14] call this I am Antonio and I am a developer
[02:10:20] let's go ahead and try and doing that so in here as you can see it immediately
[02:10:27] finished and you can see the step was called summarizer and you can see the content inside so the content is you are
[02:10:36] an expert summarizer you summarize in two words and then we passed in the role user summarize the following text i am
[02:10:43] Antonio and I am a developer and in here I think we can already see the output and there we go the output was Antonio
[02:10:50] developer and if you actually look at the finalization step I think that is exactly what you will find so
[02:10:58] output.content is Antonio developer amazing so we officially created our
[02:11:05] first AI background job so now just for fun let's try and change
[02:11:12] it up just a little bit how about we change the system prompt here actually
[02:11:18] let's change the name of the agent to code agent and let's call this code agent and call code agent.run
[02:11:27] and now we're going to say you are an expert Nex.js developer
[02:11:33] and let's go ahead and just say something like you write readable
[02:11:38] maintainable code and let's go ahead and also answer you
[02:11:46] write simple Nex.js snippets
[02:11:52] like button component Nex.js and React
[02:12:00] snippets okay let's just do that and then write the following snippet like this so
[02:12:09] this is still called hello world that's perfectly fine we don't have to change anything else but let's just see what
[02:12:15] we've achieved now for example I'm going to say uh create a button component
[02:12:24] i'm going to click invoke background job and you can see this is a bit longer running task and let's see what it
[02:12:31] created i'm not really sure what the output would be here but here we have it here's a simple and reusable button
[02:12:37] component using Nex.js and you can see how it actually writes code import react
[02:12:43] const button with props on click children type button class name and it returns JSX button on click it has class
[02:12:52] names it uses tailwind it added a class name prop it has children in the button
[02:12:57] export the default of the button so basically a fully working button so we
[02:13:04] are you can say halfway there right we just made AI create a React component so
[02:13:12] the next step that we have to learn is how to make it use tools and run this
[02:13:18] code snippet it just created inside a sandbox inside of a cloud environment
[02:13:26] that we can then show to the user as a result so that's what our next chapter
[02:13:32] will be about and I think that in the this chapter we've done what we aimed to do so let me just check this we chose
[02:13:40] our AI provider and we've set up in justest agent kit and we even tried a
[02:13:47] very simple AI step right so basically that's how you're going to write uh
[02:13:53] agent kit tools and we are then only going to extend it by introducing tools
[02:14:02] one of the tool can be terminal usage another tool can be create files a third
[02:14:08] tool will be read files right that's what we're going to do and then we're going to explore networks and routers so
[02:14:16] we can keep the uh agent in a execution loop so it consist so it constantly
[02:14:23] creates new components until its task is finished you saw that in the intro video
[02:14:29] of this tutorial i had a lot of uh coding steps that's by because it is in
[02:14:34] a execution loop until it completes its task so that's what the tools will be
[02:14:41] used for we're then going to have the state history a bunch of things and then
[02:14:47] finally we're going to have the finalization step where it will save to the database and it will uh save the URL
[02:14:55] of the sandbox so we can show that to the user so in order to advance further
[02:15:01] and create these tools and things like that we're going to have to establish our sandbox because without the sandbox
[02:15:08] we can't work right so that will be our next step for this chapter uh we did a
[02:15:15] very good job we created a very simple interface here on the front end and we are now able to call AI background jobs
[02:15:23] and we are able to get some AI code right here so later on when we actually
[02:15:30] connect this to a proper network the function will say coding agent right
[02:15:36] you're going to see it's very very cool amazing uh so now what we have to do is
[02:15:41] we have to uh open a new branch and push to GitHub so let's go ahead and open 05
[02:15:47] AI jobs branch I'm going to go here and as you can see six files changed one of
[02:15:54] them was the ingest database upgrade which is Again I'm guessing some cache for the ingest developer server so in
[02:16:02] here I'm going to create a new branch and I'm going to call it 05 AI jobs i'm
[02:16:09] going to stage all changes here 05 AI jobs and I'm going to go ahead and click
[02:16:16] commit and then I'm going to publish the branch and if you want to you can press
[02:16:22] yes and then this code rabbit uh free code rabbit extension will analyze all
[02:16:28] of these files or if you prefer you can go to uh where we are now going to open
[02:16:34] our pull request and in here we're going to have that very same review
[02:16:43] and here we have the code rabbit summary so we added an input field allowing
[02:16:48] users to submit custom prompts for code generation so you can see how it connected all of those separate entities
[02:16:56] of ours from the front- end input to the TRPC invocation of a background job to
[02:17:01] the actual content of a background job and we now generate code snippets dynamically using an AI agent
[02:17:07] specialized in Nex.js development so in here we can see step by step we
[02:17:13] can see the sequence diagram as always you can see how it now features the new agent kit right here
[02:17:20] and in here we have some potential issues so you can see how it cares about
[02:17:26] our TRPC value because we are uh lacking any kind of validation we're not even
[02:17:32] requiring a minimum length so obviously it is telling us that that's something we should add of course and we will
[02:17:38] later on we're going to change our form schema entirely so you don't have to worry about that right now it's just for
[02:17:44] demonstration purposes in here it's recommending using constants instead of hardcoded strings
[02:17:52] and that is exactly something we will do so later on I have prepared very very
[02:17:58] large system prompts which I have tested on which gave me the best results so I
[02:18:03] will share them with you and then you will paste them in your app and you will be able to use them as constants
[02:18:11] and in here it again suggests some sanit sanitization and uh some other limits on
[02:18:19] the front end uh my apologies in the background job i thought that this was the submit function it is not we will
[02:18:25] take care of that as well uh and yeah no need to do anything else
[02:18:31] here because this will not look like this we are going to modify it quite
[02:18:37] heavily in the next few chapters when we introduce the actual agent network
[02:18:43] great so I'm going to go ahead and merge this pull request so 05 AI jobs i'm not
[02:18:49] going to delete the branch simply so I have everything here and then I'm going to go inside of my IDE here and I'm
[02:18:56] going to go back inside of my main branch and I'm going to synchronize the changes like this so everything is now
[02:19:03] up to date i'm going to select no for uh this trigger of the code rabbit extension this time simply because this
[02:19:10] is a merge which we just reviewed right i'm going to open the graph here just for a sanity check to confirm that my
[02:19:16] last changes were 05 AI jobs and they are great so that marks the end of this
[02:19:22] chapter and in the next chapter we're going to learn how to create uh online
[02:19:29] sandbox cloud sandboxes which run Nex.js JS applications which in the following
[02:19:35] chapters will be something our agents will work on and create new components and run terminal commands into amazing
[02:19:42] job and see you in the next chapter in this chapter we are going to explore
[02:19:49] E2B sandboxes this will be the environments where our AI will generate
[02:19:56] files and create a working Nex.js application in this chapter our specific
[02:20:02] goal is to create an E2B account learn how to use their command line interface
[02:20:08] and create a Docker file template for our Next.js project and then push that
[02:20:14] template to E2B and then we're going to preview that Nex.js application inside a
[02:20:22] sandbox so we're not going to make AI create any new files and run any
[02:20:29] terminal commands right now the goal for this chapter is to learn more about the
[02:20:34] sandboxes how they work and basically to create a template that we are going to
[02:20:40] use moving on to uh create working Nex.js applications so we're going to
[02:20:47] start by creating an E2B account you can use the link in the description or the
[02:20:52] link you can see on the screen to let them know you came from this video as you can see uh in short E2B allows you
[02:21:01] to run AI generated code securely in your application it's an opensource
[02:21:08] runtime for executing AI generated code in secure cloud sandboxes it is made for
[02:21:14] Agentic and AI use cases and some of the uh uh some of their customers are
[02:21:21] Perplexity Hugging Face Manus and even Grock so these are very very big names
[02:21:28] in AI here and my experience with E2B was nothing short of amazing right so
[02:21:37] they are built for AI use cases so for exact thing that we are building here it
[02:21:44] is generative UI this is pretty much the thing that we will be building here but they have an even deeper use case which
[02:21:52] I highly invite you to explore yourself so let's go ahead and create an account
[02:21:58] and let's go in the dashboard after you create an account you will
[02:22:03] probably be redirected to your sandboxes which looks like this and at the moment
[02:22:10] you will probably have zero sandboxes running if you head into templates you
[02:22:16] will probably have less templates than I do you might have three i have five
[02:22:21] templates because well I explored E2B while I was developing this project you
[02:22:27] can see that I have this code with Antonio Nex.js thing you don't have this
[02:22:32] so I have this because I tested it same thing with this no-name template right
[02:22:37] you probably have desktop code interpreter and base i assume that's the
[02:22:43] things you have you probably don't have these two so no worries about that and I
[02:22:48] just want to show you uh inside of your budget you should see your credits so you should have $100
[02:22:56] uh free for your new account and as you can see I tested E2B pretty thoroughly
[02:23:03] so I I really really tested it all day every day and I barely spent $9 so it is
[02:23:11] quite well optimized for tutorial making so ensure that you have that in your
[02:23:17] budget make sure that you have the credits uh and now let's go ahead inside
[02:23:23] of the documentation here and specifically let's go in the CLI
[02:23:29] installation so you can use brew or you can use npm i used npm here and once you do that you
[02:23:38] should be able my apologies for this you should be able to run E2B right and you
[02:23:45] should see a bunch of options on how you can run it and you can shut down your app right so basically E2B should become
[02:23:52] available after you install uh either via npm or using brew so what we have to
[02:23:59] do next is we have to authenticate right so E2B O login uh should
[02:24:07] open up you can see that I am already logged in so uh in here I get that
[02:24:12] message but you should get a not you probably won't get this message instead
[02:24:17] you will get redirected to E2B page and from there you're going to have to uh
[02:24:22] approve the login and then you'll be good to go so once you've logged in uh what I would
[02:24:30] suggest is try uh listing sandboxes or just try listing something just to
[02:24:37] confirm that you are logged in so I have no running sandboxes so this is my message i believe that if I wasn't
[02:24:43] logged in I would get some kind of error here right so just make sure that at least you get a message like this which
[02:24:50] means okay you're logged in but you have no running u you have no running
[02:24:55] sandboxes great so now uh what we have to do is we have to learn how to add a
[02:25:02] new template because right now you can see that inside of our E2B here
[02:25:08] templates uh you probably have three of them as I said desktop code interpreter
[02:25:14] and base but what you need is a NextJS template now they do have their own
[02:25:20] Next.js template which you can use but I don't want you to do that i want you to learn how to create your own template so
[02:25:28] for this we're going to have to go into the second uh step so we've created CLI
[02:25:34] and we've connected to our account now we need to create a Docker file template
[02:25:39] now I have provided you with a GitHub repository with two files that we are
[02:25:45] going to need for this not because uh I don't want to write this with you but because we have to be very careful about
[02:25:52] writing these files right so this is what I suggest we do now as always ensure that you're on your main branch
[02:25:59] you can synchronize changes just in case and then go inside of your source source
[02:26:04] folder here my apologies outside of source folder so completely outside create a new folder called sandbox
[02:26:12] templates like this and inside create a new folder which we're going to call
[02:26:17] nextjs and then in here you are going to create
[02:26:22] e2b docker file like this you don't have to
[02:26:28] install any extensions at least I didn't use any for this now this docker file
[02:26:33] has the content that you can find in the public repository sorry that which you
[02:26:38] can access by using the link in the description or the link you can see on the screen and when you're in here you
[02:26:45] can access that file so just go ahead and copy it entirely and paste it here and now we're going to go ahead and uh
[02:26:52] explain what it does so the first thing we do is we set the environment in our case that's going to be node after that
[02:26:59] we run a terminal command to install kernel so we updated the system we get
[02:27:05] the install method for curl and then well whatever else we need to do here
[02:27:10] i'm not too familiar with configuring docker environments but basically in this part we configure curl after that
[02:27:18] what we do here is we copy another important file a bash script compile
[02:27:25] page which we currently don't have so let's create it compile_page.sh
[02:27:32] make sure to not misspell this because we need it right here and you can find
[02:27:38] the content in the same uh public repository here i'm going to explain what this does as well but for
[02:27:45] now just make it like this after we copy this compile page and we
[02:27:53] put it in the environment right in this docker environment we run this command
[02:27:59] on it to make it executable then we change our directory to next.js
[02:28:05] app and then inside of that next.js app we run a command which you've already
[02:28:11] seen a couple of times create next app so basically the same way we started this project we are now creating a
[02:28:18] docker which is going to start the project the same way the versions I'm using are 15.3.3
[02:28:25] with chat 2.6.3 the reason I'm using these versions is
[02:28:30] because when I started making this tutorial uh those were the newest versions you already know that now that
[02:28:36] I'm recording this tutorial there are newer versions than this so if you want to you can upgrade but I'm going to stay
[02:28:44] with these versions for now simply because I know that they work for me so
[02:28:49] later on when we finish the project you know feel free to upgrade this to 7.0 and this to 7.0 zero and this to
[02:28:56] whatever is the newest version but for now I want to stick with these versions because they worked for me initially now
[02:29:02] let's explain these flags so why do I add d- yes after npx and why do I add d-
[02:29:09] yes after create next app the reason I'm doing that is because you have to
[02:29:14] remember these commands will be running in a container in a dockerized container which means no user will be able to
[02:29:21] interact with them remember when we started our Nex.js application we had a bunch of questions do you want to use
[02:29:27] tailwind do you want to use slint do you want to use this that so because of that
[02:29:32] uh I have to uh just agree to all of those things so the terminal doesn't
[02:29:38] hang right so it doesn't block it can keep moving forward because if it blocks
[02:29:45] it will not work that's why we have to add both d- yes in front of npx and in
[02:29:51] front of our command because npx might ask you to upgrade right so we will also
[02:29:58] agree to that right whatever you ask me I agree to and same is true for running
[02:30:03] chaten in it and for adding all shatzen components
[02:30:09] and then what we do is the following we move the content of that new folder
[02:30:14] nextjs app where we just added Nex.js and all of its components and we move
[02:30:20] that entire content into home user directory and then we remove the old
[02:30:25] folder the reason we do that is simply because it is easier for AI to
[02:30:30] understand that the the place where it's located because initially it will be loaded here we just tell it wherever you
[02:30:38] are this is where you have the next.js application you don't have to go to any other directory trust me that is much
[02:30:45] easier for nextj for an AI to understand because otherwise it will hallucinate
[02:30:50] things this way it's just easier to work with so you might be wondering why did we then even open a new folder if we're
[02:30:58] just going to bring all the stuff back here because if you try to initialize
[02:31:03] this command the dot basically means in this folder if you try to do that inside
[02:31:09] of home user it would fail because in order to initialize a next app it needs to be an empty folder and home user has
[02:31:17] some hidden files right so it's never really empty that's why we needed to do
[02:31:22] this trick so that is basically our docker file now let's explain the compile page so the compile page is a
[02:31:30] little trick that we are going to use to ensure that the next.js JS application is running and that the root page is
[02:31:37] compiled so basically in here we have a function called ping server which uses curl which we install right here and we
[02:31:45] are attempting to ping localhost 3000 and we are doing an iteration of 20 uh
[02:31:52] I'm not sure not too familiar with the bash shell language to tell you if this is seconds milliseconds I'm not sure but
[02:31:59] basically it's more than enough time for the server to start so it gives it 20
[02:32:05] attempts right to try and get a 200 response and once it does it simply uh
[02:32:13] uh marks it as done and then it runs that method ping server and it goes
[02:32:19] inside of home user where we just said that we create this project and it runs
[02:32:25] npx nextdev- turboac so the turbo pack is uh really cool here
[02:32:32] because it speeds up the uh the start of the dev server so it's actually very useful in this case
[02:32:39] great so once you have these two things the second part is very important and
[02:32:46] that is that you set up Docker inside of your project
[02:32:53] so here I am on the Docker landing page you can use the link you can see on the screen to let them know you came from
[02:32:59] this video uh and basically the way I set up Docker in my project is by
[02:33:04] downloading Docker Desktop i use a MacBook so I download it for Apple
[02:33:10] Silicon if you use Windows you choose your architecture here or if you use Linux uh well you probably know what
[02:33:16] you're doing then so after you've done that make sure that you have Docker uh
[02:33:22] installed so in here let me just try and open it back here uh since if I go inside of uh
[02:33:30] let me just try and find the documentation here docker desktop let's go into overview and in here somewhere
[02:33:38] we should have setup install and in here there we go
[02:33:44] so in here we have some deeper documentation here uh on on Mac and on Linux it's pretty straightforward right
[02:33:50] if you install it uh with a DMG it will add it to the terminal uh as well but if
[02:33:57] you don't here's how you can add it from terminal as well also if you want to you can use orb stack that's a Docker
[02:34:04] alternative all right but the reason I kind of don't know how to explain how to
[02:34:10] install Docker is because I don't know if I'm talking to a person who has a Windows who has Linux or who has Mac OS
[02:34:16] right so that's why I'm kind of don't want to give you too much information and I don't want to tell you something incorrectly but basically try to
[02:34:23] research yourself you know uh what you are using right so try and install that
[02:34:32] and your goal is basically to be able to have docker available
[02:34:39] right that's kind of the goal you should not get an error in docker
[02:34:45] and on windows In here you can see pretty similar instructions uh I'm not
[02:34:51] too sure what this means i don't use Windows uh but in here I think it is
[02:34:56] important for you to be able uh to run Docker from the command line as well uh
[02:35:04] but at minimum you should be able you you need to install the Docker desktop
[02:35:10] package and you should be able to start that application at minimum that's the minimum thing that I expect right so now
[02:35:18] I'm going to go ahead and start my Docker application actually the first thing I'm going to do is I'm going to
[02:35:24] try without Docker started simply so uh we can test if uh if the command fails
[02:35:32] so I want to show you what happens if the command fails first so let's go ahead inside of SDK reference CLI
[02:35:40] template and let's do template build so in here we have E2B template build
[02:35:46] command and the way we're going to do this is the following go inside of sandbox templates and go inside of
[02:35:52] next.js like this so I'm going to try and run B2B template
[02:36:00] build here and I'm going to give this a name and I'm going to call it vibe next.js test so that will be the first
[02:36:08] thing I'm going to try so in here you can see how uh it found the E2B docker
[02:36:14] file and it requested build for the sandbox template ID with this name login
[02:36:20] succeeded and then it attempted to run docker build and then it failed right so
[02:36:26] this is the error you will see if your docker is not running so now I'm going
[02:36:32] to start docker for me very simply I'm just going to open the application docker and then in here uh I will have
[02:36:40] docker desktop available you can see docker desktop is now running so uh
[02:36:46] let's see if that will be enough for me to run this and try it so let me see e2b
[02:36:53] template build let's see this time and there we go so all I had to do was
[02:36:59] install Docker Desktop and I need to make sure that I have Docker Desktop
[02:37:04] running that's the important thing for me so you can actually stop this now
[02:37:09] because it will take some time to build but it's not going to work correctly i just wanted to show you how it looks
[02:37:15] like when your Docker is not running basically this is the error you will get so just make sure you have Docker
[02:37:21] running you don't even have to create any image on Docker or nothing we are doing that now right so just make sure
[02:37:28] you have Docker installed on your system and make sure you open whatever application you installed it can be
[02:37:34] Orbstack it can be Docker Desktop right uh I'm not sure if you need it inside of
[02:37:39] here right as I'm I I keep saying that because I don't know what machine you're on i have it inside of my terminal as
[02:37:46] well i'm not sure if that matters right because you can see that in here it does
[02:37:52] run the Docker command so it probably does matter the fact that I have it
[02:37:58] inside of my terminal so uh make sure that you have Docker CLI installed as
[02:38:03] well if you don't you might even see a different error showing here great but
[02:38:08] once you get to this part once you get to the fact that after Docker build is being fired you start seeing these kinds
[02:38:15] of messages right something resolving something transferring it means the Docker is working and then you can
[02:38:22] cancel it using command C or control C uh and then we're going to run a proper
[02:38:29] command with a proper uh start command so now in here here's what we have to do
[02:38:37] this basically uh we have to add
[02:38:42] E2B template build-ame vibe next.js js
[02:38:50] test two dash cmd and you have to add
[02:38:55] compiled_page.sh so now uh let's go ahead and run this
[02:39:04] again so I'm just going to wait to see this succeed there we go and now I'm
[02:39:09] going to pause until this part completes because it is a little bit long you know
[02:39:15] it needs to upgra it needs to upload the entire Nex.js project there with all the
[02:39:20] packages and everything and it needs to you know install curl and all of that so
[02:39:25] I will pause until some interesting things show here so you can compare with your process as well
[02:39:33] so here's an interesting part uh it is running npx create next app and you can
[02:39:38] see my result typescript types node types react tailwind CSS so it is
[02:39:43] obviously successfully installing this with no questions asked that's why these
[02:39:49] parts were so important because if we didn't include this uh it would be blocked by waiting for the user input
[02:39:56] right that's why that is important it was also successful in copying
[02:40:03] compile page.sh so we did this correctly as well
[02:40:10] now I am running chaten in it i'm selecting neutral color i'm forcing
[02:40:16] everything to install here right so I'm just making sure that I'm not adding any prompts and there we go it's succeeding
[02:40:23] it uh checked the reg registry it found app globals CSS and now it's installing
[02:40:28] all dependencies so so far so good
[02:40:34] now it is adding all components you can see again very successful it found
[02:40:40] global CSS it is upgrading it and it is installing all of those radics packages
[02:40:45] which we use for our component so it's we are basically doing the same setup we did for our project but this time inside
[02:40:52] of a docker container great and now it has finished that part
[02:40:59] and now it is moving the entire content from Nex.js app into home user and removing the old folder now this is this
[02:41:06] command actually failed for me a lot during the initial development of this project and the reason was actually
[02:41:13] because I was missing this d- yes commands so if this part is successful
[02:41:18] for you as it is to me right now you have pretty much succeeded in doing this so if this part fails for you it is
[02:41:26] almost certainly because uh you forgot to add d- yes to some of this basically
[02:41:33] it's hanging on some command and it didn't create the Nex.js app uh great so
[02:41:38] now what's happening I think you know I'm I'm new to Docker as well i've briefly experienced it before but now
[02:41:45] what's happening is obviously pushing all of that data to the Docker container on the E2B app
[02:41:54] and just to confirm in case you're wondering this part does take a while
[02:42:01] after that part has completed it is triggering the build and here you can
[02:42:07] track the progress of the build itself so this is more specifically a build of
[02:42:12] the docker image we're not building the Nex.js app right those are two different things our Nex.js uh app is just a
[02:42:20] development instance we are building the Docker image here
[02:42:27] all right so mine uh failed so I will uh it looks like it failed because
[02:42:35] it is missing the compiled_page.sh command not found and that's definitely
[02:42:43] because of this i should have uh done this differently i have to find a way to
[02:42:49] execute this in a different way something like this i will test it out
[02:42:54] so I know for sure and then I will tell you the correct command
[02:43:00] so I think that the start command should be this forward slashcompilepage.sh
[02:43:08] and let me just show you something uh regardless if this part fails or not i
[02:43:13] mean depending on how I edit this video perhaps I told you not to even run this command in advance right but you can see
[02:43:20] that I have something called e2b.tl generated in here you can see my start
[02:43:26] command is compiled_page.sh sh so I have two ways of changing this now i can either change it here or I can
[02:43:34] change it here but you can see how it remembered all of these things but for now basically this should be the working
[02:43:42] command so I'm going to pause and try it again
[02:43:47] and this time it worked you can see that right here it is waiting for the template to be ready and then it is
[02:43:54] waiting for server to start a couple of times and then finally we can see next.js 15.3
[02:44:01] and that signals that it is done template is ready pausing sandbox
[02:44:06] template so be very very careful here during my initial development of this
[02:44:12] project I was able to get to template is ready and pausing sandbox template and
[02:44:17] uploading template but I actually never saw this part let me just go up here it
[02:44:23] is very important that you can see this part in your terminal because this means that it's actually working if you can't
[02:44:30] see this everywhere even with this saying it's ready it will actually not
[02:44:37] be working so just make sure you did this correctly and also on the second run this runs much much faster because
[02:44:43] half of the I mean the entire project is already uploaded right so you won't have to wait that long but basically this was
[02:44:50] the final command E2B template build and the cool thing now is that you actually
[02:44:56] get instructions on how to use this you can see that you can use the name or you can use the ID so I don't know what this
[02:45:03] actually tells us is the name unique or not i think it might be unique per team
[02:45:09] uh which then again you know uh depends if you're going to publish this or not
[02:45:15] uh what does publishing mean well I'm going to explain in a second but basically now you can go find your E2B.l
[02:45:21] file and in here you can see all the information team ID start command docker file template name template ID and from
[02:45:29] now on if you ever want to do any changes to here you can just do template build that's it and you can just modify
[02:45:36] whatever you want from here want to change the name just change the name here and run template build so right
[02:45:42] that the in the tommo file that's basically where the configuration is now uh great so before we move on now let's
[02:45:50] go ahead inside of E2B inside of your project go inside of templates and refresh and now if you have done this
[02:45:57] correctly you should see vibe next.js test dash2 right here and you can see
[02:46:04] that this says private so just to make things easier for now I want you to do
[02:46:09] the following i want you to copy the ID of vibe next.js test 2 and I want you to
[02:46:16] go and go to E2B template publish here
[02:46:21] and let's go ahead and do the following so actually we need the team ID my apologies so just go ahead and find I
[02:46:29] think it's inside of your team here find the team ID and copy it and inside of
[02:46:34] here so you are inside of this uh Nex.js template so you can just do E2B template
[02:46:40] publish D and then paste the ID of the team and this will make the template
[02:46:46] public to everyone outside of your team the reason you're doing this is simply because uh it will be easier to connect
[02:46:52] to it at least that was my experience later on we can easily unpublish it or you can delete it the reason this is
[02:46:59] kind of uh you know you should be wary of this you should not share your uh template ID with anyone because I can
[02:47:06] use it and I can uh use your credits right i can spend your budget here so be
[02:47:12] careful make sure that only you know about this and later I will make sure to find a way to unpublish this so that
[02:47:19] only you and your team can use this great so now what should happen is
[02:47:25] inside of your templates when you hit refresh and find that vibe nextjs test 2
[02:47:31] it should say public under visibility and that basically means you did it this
[02:47:37] is now working so now what we have to do is the last part of this chapter we did
[02:47:43] this we did this and we even did this it's time to actually start this sandbox
[02:47:48] right let's see if that next.js JS app is actually working or not and lucky for
[02:47:54] us this is quite easy to do so what we're going to do now is we're going to
[02:47:59] go inside of source inside of ingest and inside of functions here uh and I think
[02:48:06] I completely forgot but yeah we have to uh we have to install
[02:48:12] uh E2B i think I forgot that entirely so let's add E2B code interpreter to our
[02:48:19] project and make sure you go in the root of your app like this and I'm going to show you the version of this package now
[02:48:27] so let's go inside of package.json quickly so it is 1.5.1
[02:48:34] that's my version now let's go inside of our functions here and let's import
[02:48:41] sandbox from E2B code interpreter package which we just installed and then
[02:48:46] what we're going to do is the following let's go ahead and before we create an agent let's do const sandbox ID await
[02:48:55] step.r run and we can extract the step from here we removed it in the previous
[02:49:00] chapter I believe so step.run run get sandbox ID that will be the first step
[02:49:05] we're going to run and in here we're going to attempt to get the sandbox
[02:49:13] by doing await sandbox.create and inside of here you will simply pass
[02:49:18] the template ID so in your case this will be vibe next.js test 2 now you will
[02:49:25] probably have a different name for this because I think if they allow public templates there probably has to be some
[02:49:32] kind of originality here I guess so once you've created that go ahead and simply
[02:49:38] do await sandbox set timeout uh actually you don't have to change the timeout i'm
[02:49:43] going to explain what the timeout is in a second but for now let's just do sandbox.box ID so this will be the step
[02:49:51] which we are actually going to preserve here and keep throughout uh this entire project because we will always need the
[02:49:57] sandbox ID and now that we have the sandbox ID uh what we have to do is we
[02:50:03] have to create a sandbox URL so after the agent finishes let's pretend that
[02:50:09] this agent now actually connected to this sandbox and then added a bunch of files then what we would do is we would
[02:50:15] generate the sandbox URL using await step.r run get sandbox URL
[02:50:24] in here we would get the sandbox again using await and then in here uh we need
[02:50:29] to create a util called get sandbox so let me just go ahead inside of the
[02:50:35] ingest and create utils ds and export asynchronous function get sandbox
[02:50:42] which accepts sandbox ID which is a type of string
[02:50:47] let's get the sandbox using await sandbox from E2B code interpreter.connect
[02:50:54] sandbox id like this and then in here
[02:51:00] just return sandbox so basically I'm writing a function to make this uh
[02:51:06] reusable you're going to see why later and also let's import this like so so the structure now that you have get
[02:51:13] sandbox you can do await get sandbox here and pass in uh the sandbox id and
[02:51:20] then return sandbox.get host
[02:51:25] 3000 so uh basically what this is it
[02:51:31] creates the host under the port 3000 why 3000 well we know why because of our uh
[02:51:39] sandbox template right inside of here we know it's running on port 3000 that's
[02:51:44] the only port it can run on it's a Nex.js app and this is actually only the host so let's do con host
[02:51:52] to be that and then return open back https
[02:51:59] and then post like this and then in here
[02:52:05] sandbox URL like this are you ready to try this out now make sure you have
[02:52:12] imported the get sandbox right so let's go ahead and do it npm rundev in one npx
[02:52:19] ingest cli dev in the other it is running perfect let's go to localhost
[02:52:25] 3000 make sure you have your ines development server here and I'm just going to do uh create a button component
[02:52:33] again why not and let's go ahead and see what's going on here oh so there we go it is failing
[02:52:42] so something uh you can see the error invalid API key so we can cancel this
[02:52:47] run because I forgot to add the API key uh I'm constantly not reading this the
[02:52:53] way I should so let me just go ahead uh and add click on API key here
[02:53:00] uh and we can find it at the dashboard so let's go back inside of our dashboard here uh you can see I already have some
[02:53:08] so I'm going to click create new key here and you can find it here under API keys so create new key vibe dev and I'm
[02:53:16] going to click create key here i'm going to copy that key and let's go inside of
[02:53:21] environment here e2b and let's add it
[02:53:27] so it's going to be E2B API key
[02:53:32] like that and if you add it like this I don't think you have to explicitly add
[02:53:38] it anywhere because this is what it will be looking for so uh I'm not sure if I
[02:53:45] can find the documentation for this specifically but I think that now it will be working
[02:53:50] let's try again invoke another background job and let's see do we get any errors or do we successfully get a
[02:54:00] running template we're going to see get sandbox ID has succeeded and now it's doing the coding agent thing it's
[02:54:06] generating some code and now it's grabbing the sandbox URL and in the finalization here you should see the
[02:54:12] output of an AI who created a component and you should see an actual URL let's
[02:54:19] try and visit this URL fingers crossed and we should now see a Nex.js
[02:54:25] application and we are a completely empty Nex.js application hosted in E2B
[02:54:32] started from our background job you are halfway there you can already uh kind of
[02:54:39] tell what the next steps are we are going to dive deeper into E2B sandbox
[02:54:46] API now and we're going to learn how to run terminal commands how to create files how to read files basically how to
[02:54:54] translate what it's now doing here very simply as an output into actually
[02:55:00] modifying the code in this sandbox amazing amazing job i know this chapter
[02:55:06] wasn't too easy a lot of new things Docker Docker files all of those things but if you've come this far you did it
[02:55:13] amazing amazing job so let's go ahead and mark this as complete and yes this
[02:55:20] uh will stop working after some time and that's completely normal so after about 5 minutes I think by default uh this
[02:55:27] link will show an error right so that's normal don't worry we can change the timeout later
[02:55:34] so now let's go ahead uh and let's merge this so I'm going to go ahead
[02:55:41] and I'm going to open my source control here i'm going to go ahead and create a
[02:55:46] new branch 06 E2B sandbox let me just confirm
[02:55:51] that's my chapter name so sandboxes i'm going to go ahead and stage all of
[02:55:57] my changes including the Docker files of course and I'm going to do 06 E2B
[02:56:05] sandboxes here and I'm going to commit and I'm going to publish my branch again
[02:56:10] there is a free code rabbit extension you can use if you want to review your changes and learn about all the things
[02:56:17] you can do differently in your code so if you want to you can click review all changes or if you're like me and you
[02:56:25] like to see uh the summary and all other things you can use their pull request
[02:56:30] function so now I'm opening my new pull request here which I will merge so let's go ahead and review it
[02:56:38] and here we have the code summary so what I'm very impressed with is how well
[02:56:43] Code Rabbit understands what we just did so we introduced a sandbox environment for Nex.js allowing users to create and
[02:56:51] access isolated Nex.js instances we added functionality to generate and
[02:56:57] return a unique URL for accessing sandbox next.js app so quite impressive
[02:57:03] that it understood the entire context of this pull request with nothing more than files very very very nice so in here we
[02:57:12] even have an entire sequence diagram demonstrating how that happens so once the user triggers a hello world
[02:57:18] background job we go ahead and create a new sandbox with our template name after
[02:57:24] that we return the sandbox ID and we have it for that session of that background job we then use our new
[02:57:30] package E2B code interpreter to return a sandbox instance and from it we extract
[02:57:35] the sandbox URL amazing and you can see how it even has some related pull
[02:57:42] requests it detected where we initially added hello world so if you were working in a team if this was some big operation
[02:57:49] you can now link pull requests automatically with this extension amazing so in here it has some potential
[02:57:56] issues regarding our TOML file but that doesn't matter because this file is not generated by us in the first place so it
[02:58:03] is okay for it to be like this in here it is suggesting improving the compile
[02:58:08] page shell script which could be completely valid i'm don't know bash i'm
[02:58:14] I'm also mixing bash and shell i'm not even sure what is the correct name so
[02:58:19] for all I know this could be completely correct but since I want to be very careful
[02:58:27] about this part you know I'm not going to change it because I know it works
[02:58:32] right so good enough for me at the moment uh great uh so in here it
[02:58:38] recommends adding some try catch all of the things which we will add later but
[02:58:43] in a different syntax because we will implement the agent network and the agent retrying and it's going to work in
[02:58:48] a different way it's going to be using tools so overall pretty good summary pretty good review let's go ahead and
[02:58:54] merge this now as always I'm not going to delete my branch simply so I have access to all of my progress here
[02:59:02] amazing amazing job so as always go back to your IDE here and change to main
[02:59:08] branch and then click on synchronize changes and as a final sanity check you
[02:59:14] can go ahead inside of source control inside of graph and you will see 06 E2B
[02:59:19] sandboxes have just been merged amazing amazing job i believe that marks the end
[02:59:25] of this chapter and see you in the next chapter where we are going to learn how to make our AI use tools such as
[02:59:32] terminal to install some things and actually modify these sandboxes amazing
[02:59:38] amazing job in this chapter we're going to add tools
[02:59:44] to our AI the tools we are going to add are going to be the terminal tool which will allow
[02:59:51] the agent to run commands create or update files tool which as its name says
[02:59:57] will allow the agent to create or update any files within its environment and
[03:00:03] finally we're going to have read files which will be able to read files we are
[03:00:09] then going to add a completely new prompt for our agent and we are then going to implement the agent network and
[03:00:16] the routers so we are going to heavily rely on agent kit by ingest you can use
[03:00:23] the link you can see on the screen or the link in the description to let them know you came from this video so in here
[03:00:30] what we are going to do is we are going to uh add some tools tools are used to
[03:00:36] extend the functionality of agents for structured output or for performing
[03:00:41] tasks so for example they are used to call code enabling models to interact
[03:00:47] with systems like your own database or external APIs like B2B so let's go ahead
[03:00:54] and let's create a very simple tool which will be allow our agent to
[03:01:00] interact with the terminal so the first thing we're going to do is ensure we're on the main branch and we
[03:01:07] are going to synchronize our changes and just confirm your last merge was E2B sandboxes
[03:01:13] after that let's go inside of source inest functions
[03:01:19] now in here we're going to do the following after you create the coding
[03:01:24] agent uh go ahead and do the following right after your model add tools
[03:01:32] open this array and let's create tool which you can import from ages uh a
[03:01:39] inest agent kit in here let's go ahead and give this tool a name it will be called terminal
[03:01:48] add a description use the terminal to run commands
[03:01:54] and add the parameters which the AI will pass to this tool it will be a very
[03:02:01] simple command which is a type of string and after you have added the parameters
[03:02:07] and the handler method extract the command from the first
[03:02:13] argument and extract the step from the second argument
[03:02:19] in here you are going to return the step execution
[03:02:24] await step question markr run the reason
[03:02:30] we need to use question mark is because step can be undefined so let's go ahead and run a step called terminal
[03:02:38] it's going to be an asynchronous method inside of this step and the first thing we're going to do is we are going to
[03:02:44] create an object called buffers inside of here we are going to set std
[03:02:51] out to be an empty string and std error to be an empty string as well now let's
[03:02:58] open a try and catch method instead of the try let's grab our uh let's get our
[03:03:05] sandbox here using await get sandbox and pass in the sandbox ID
[03:03:13] then let's grab the result of await sandboxcomands
[03:03:20] and pass in the command so we are reusing our get sandbox method from
[03:03:25] utils i also imported zod so make sure you add this as well
[03:03:31] uh and we are basically doing the same thing we're doing right here we are establishing the connection with our
[03:03:36] sandbox using this simple util here so we don't have to repeat this every time
[03:03:42] and now what we are doing is we are running a command so you can learn more about this uh by going inside of the E2B
[03:03:49] documentation and simply learning about the command let me see if I can find
[03:03:55] that here here we have the commands so this is how you basically run commands in your environment perfect so now let's
[03:04:04] go ahead uh and define some more settings here so after we run the
[03:04:10] command let's define on std out grab the data which is a type of string
[03:04:17] and for buffers std out simply
[03:04:22] add that data and the same thing on std error so data is a type of string
[03:04:30] and in here simply add buffers std error
[03:04:36] plus equals data so we are handling all of the results of running the terminal
[03:04:41] commands in this object so we're going to know if the terminal command succeeds or if it fails that's why it's important
[03:04:47] to keep track of the result and then let's go ahead and let's return result
[03:04:54] std out and then in the catch method let's extract the error here first let's
[03:05:01] do console simply so we see this in the terminal open back and you're going to
[03:05:07] say command failed render the error and then you can use forward slashn to break
[03:05:14] into new line so it's more readable std out will be buffers std out
[03:05:21] and then go ahead and break line again std error will be buffers std
[03:05:31] error so that's going to be the console log and then you're going to return the exact same thing
[03:05:39] this will basically tell the agent what went wrong with additional information about std out and std error so yes just
[03:05:48] make sure that you don't accidentally type this incorrectly as it is important
[03:05:53] for AI to understand what's going on and that is our first tool our agent now has
[03:06:00] the ability to use the terminal it uses sandbox API for this and it will keep
[03:06:08] the results of this uh terminal execution so either a success message or
[03:06:14] an error with detailed information about what happened because commands can fail
[03:06:19] and thanks to ingest they will automatically retry but now with the context of what happened so if you're
[03:06:27] building nex.js with me for some time you know that sometimes when we install a package which doesn't support next uh
[03:06:34] react 19 it fails because we need to add d-leacy pure depths so if that happens
[03:06:41] here it will first fail and then the AI will read the message and say oh okay I
[03:06:48] need to add d- legacy peer demps and ingest will automatically retry the
[03:06:54] terminal step with that new information and then it will succeed so that's how
[03:06:59] powerful injest background jobs are and now they're amazing inest uh agent kit
[03:07:07] so now that we have finished uh the terminal tool let's go ahead and create
[03:07:14] a new tool this one will be called create or update
[03:07:21] files the description will be and let me just
[03:07:26] see i think I'm doing something yes I'm doing something incorrect here
[03:07:33] i think it needs to be here and add a comma here there we go so yes so just make sure you're doing it at the end of
[03:07:40] this create tool bracket right here the description will be create or update
[03:07:47] files in the sandbox let's go ahead and let's add the parameters it's going to be an object of
[03:07:54] items and it will accept the files files are going to be an array of
[03:08:01] objects and inside we're going to have path which is a type of string and content
[03:08:09] which is a type of string as well and it's going to be the only thing we
[03:08:16] will accept so now we can build our handler method inside of this handler method let's go
[03:08:22] ahead and let's extract a few things the first things will be the files
[03:08:28] and the second thing will be step and network
[03:08:34] and now in here let's go ahead and let's get the new files by doing await step
[03:08:39] question mark run create or update files
[03:08:45] open the asynchronous method here and let's go ahead and open a try and catch
[03:08:50] block let me just add catch here there we go
[03:08:56] instead of try let's create updated files by first looking at network.state.data.files
[03:09:05] or an empty array then let's get the sandbox here await
[03:09:11] get sandbox and pass in the sandbox ID and now for const file of files
[03:09:21] await sandbox files write file.path
[03:09:27] file.content updated files file.path is now
[03:09:33] file.content so basically when the agent gets access
[03:09:40] to create or update files tool it will give us a structured input of files it
[03:09:46] just created so imagine this first part which we already have we've already seen
[03:09:52] it create a a few files I think there we go so here's a simple button component
[03:09:57] and then it just returns jsx so now it will do exactly that but it will
[03:10:03] recognize the input this accepts uh accepts so what it's going to do is it's
[03:10:08] going to return back an object let me try like this it's going to return an object like this and it will
[03:10:16] have app psx and then in here it will be you know
[03:10:22] paragraph app page this is how it's going to look like and then the same
[03:10:27] thing for any new components right this is what it's doing now and then we're
[03:10:34] going to iterate over each of that and we're going to write that to the sandbox file explorer using files.right which is
[03:10:41] the similar API like sandbox commands so that's how we know which file to
[03:10:48] write where and then we just keep a track of updated files internally in our
[03:10:54] network state simply so we can later tell the user which files were changed
[03:10:59] because technically we could just ask it in the prompt hey you know when you finish also tell me which file you
[03:11:06] changed but you can't really rely on that because AI has a token limit it can
[03:11:11] only talk for so much but for this part you can rely on this right so each file
[03:11:17] it actually writes in the sandbox box in the file explorer we are going to save it we are going to keep track of it and
[03:11:24] the reason we are choosing the format of an object rather than an array is because this way it is very easy to to
[03:11:29] overwrite any files if they change by invoking this step again because this step can be called 50 times for all we
[03:11:37] know that's why we are choosing an object rather than an array so we can just simply overwrite any path if it
[03:11:44] changes and then let's go ahead and do return updated files and then in the error here
[03:11:53] let's return error and simply render the
[03:11:58] error perfect and then uh outside of
[03:12:04] this if type of new files is equal to object
[03:12:11] network state data files will be new files
[03:12:16] so why are we waiting for this to be an object so the new files are basically the return of this step this step can
[03:12:23] either be an object or it can be a string so we are basically waiting for
[03:12:28] it to be an object and only then do we store it into our internal network state perfect so that's another tool finished
[03:12:36] now let's go ahead and let's create another tool with a name read files now
[03:12:42] in here let's add a description read files from the sandbox
[03:12:50] parameters Z dot object files Z dot array and Z dot string inside
[03:12:58] now let's go ahead and let's add a handler method again an asynchronous method
[03:13:04] and in here we are going to return await step and we just need to extract the
[03:13:11] step from here so let's do that first extract the files from here and then extract the step from the second step be
[03:13:18] mindful if you forget to do this you won't get an error simply because we have a step defined elsewhere
[03:13:26] we have it here so be careful you always have to extract the step from
[03:13:32] the tool because it holds different context so step.run
[03:13:40] read files asynchronous and in here open a try and catch block
[03:13:48] in the try block connect to the sandbox await get sandbox sandbox ID
[03:13:57] in here open the contents array and for const file of files
[03:14:05] push to that contents array so const individual content is await sandbox
[03:14:11] files read file so we read the file and then we simply push the path to be file
[03:14:21] and the content next to it so in here it doesn't really matter how we store this
[03:14:27] data because this is not for us this is for the AI if they if it needs to read
[03:14:34] data so yeah let's just fix this path so if we in our prompt instruct the the the
[03:14:42] AI agent to read before they do something they're going to use this why
[03:14:47] would they need to read something well so they don't hallucinate right so we tell it if you attempt to use a chat
[03:14:55] component make sure to read inside of the components folder so then it's going to use this tool to attempt to read a
[03:15:02] file and if it doesn't exist it's going to say "Oh okay then I need to create it or I need to use something else it's
[03:15:08] basically not going to hallucinate or assume a tool exists that's why this
[03:15:13] step is quite useful and also why we don't really care about the format too much because AI can read from various
[03:15:19] formats here and if this fails we return an error
[03:15:25] like this and that is the last tool that we need
[03:15:30] what we have to do next is we have to update our prompt and tell it that it can use these tools
[03:15:39] i have prepared a prompt for you in my public GitHub of assets you can use the
[03:15:45] link you can see on the screen or the link in the description to access it now be mindful of something i am not a
[03:15:52] prompt engineer i have no idea if this is a good prompt or a bad prompt i have
[03:15:58] generated it using AI itself so I assume it's okay i have found it to work quite
[03:16:06] well for my use case but you are free to modify it however you want it i I
[03:16:11] started out very simple like it was almost just like one or two lines and then I had to addit more and more and
[03:16:17] more instructions until it understood things very well and I found this to be
[03:16:23] kind of a very very good uh at least starting point if nothing more right but
[03:16:29] the cool thing about this project is your app can get twice as good just by
[03:16:37] adding a new model so if OpenAI or Enthropic release a new model all you
[03:16:43] have to do is use that new model and your app is suddenly twice as good so that's the cool part about working with
[03:16:50] AI right so copy this prompt from my assets let's go inside of source and
[03:16:55] let's create prompt.ts and let's paste it here so I'm going to slightly go over it just so you understand what I'm doing
[03:17:02] here so you're a senior engineer working in a sandboxed Nex.js 15.3
[03:17:08] environment why that environment well because that's what we define here
[03:17:14] so I'm telling it exactly where it is running and then I tell it some tools you can write files with create or
[03:17:22] update files you can execute commands via terminal i also tell it to use d-
[03:17:27] yes simply because uh it's not a human so it uh basically we we must not get it
[03:17:35] in a position where the terminal waits for human input then I tell it you can read files with read files so those are
[03:17:42] the first three instructions that I give it i then tell it you know some general rules don't install package JSON or log
[03:17:48] files directly you can install packages but don't modify the these directly i
[03:17:53] tell it the main file is in the app folder page.tsx i tell it that all chats
[03:17:59] components are pre-installed and imported here and then I tell it some general rules like you must never add
[03:18:05] use client to layout this must always remain a server component uh I tell it
[03:18:10] to never create any CSS or SCSS files styling must be done strictly with
[03:18:15] Tailwind and basically some rules like that so you can of course tweak this if
[03:18:22] you think you you can modify it a little bit of course maybe I will modify it during this tutorial but basically it's
[03:18:29] just a bunch of rules that I have added after I experienced it fail so after I saw that it does something incorrectly I
[03:18:36] added a new rule for that and this is important the final output so after it's
[03:18:41] fully completed I instruct it to return this type of format task summary and
[03:18:47] inside uh a description of what it just did so it needs to return with this and
[03:18:55] you're going to see why in a second this is super important and this is why I'm very strict about it because this is the
[03:19:01] only way to terminate the task if it omits or alters this section the task
[03:19:07] will be considered incomplete and it will continue unnecessarily so now that we have our new prompt let's
[03:19:14] go inside of inest functions.ts and let's go ahead and change our code
[03:19:20] agent here and let's extract the open AI here a little bit and now what we are
[03:19:25] going to do is we're going to change this model to be GPT4.1
[03:19:32] default parameters here will be temperature 0.1 now if you're using uh
[03:19:38] something that is not open AI this might not exist and that's completely okay you don't have to modify this what
[03:19:44] temperature means is randomness so the larger the number here the more random
[03:19:50] is something going to be and when it comes to generative UI I kind of want it to be deterministic and reliable rather
[03:19:57] than completely random but I give it a little little little chance of randomness so if you're using grock or
[03:20:04] anthropic you don't have this probably so that's that's that's completely okay right you can even do without this in
[03:20:11] open AI and the reason I changed the model is because 4.1 is much much much
[03:20:17] better at generating UI than 40 and for Antropic the better model is 3.5 set
[03:20:26] for Grock or Gemini I simply don't know and as I said with Gemini I have problems running these tools you can try
[03:20:33] but for me I just got errors so now let's go ahead and modify the system here to use our prompt
[03:20:40] constant from at prompt which we just added so just make sure it's this one
[03:20:46] perfect now let's go ahead and let's add a slight description here an expert
[03:20:52] coding agent there we go so I'm just going to bring
[03:21:00] back this temperature 0.1 if you're using Open AI you can add this so both
[03:21:06] you and I will get similar results i hope great now that we have these tools
[03:21:12] we are still not ready to try them out just yet because what we have to do now
[03:21:17] is we have to add life cycle here so after the array of tools ends so make
[03:21:24] sure that you find where the tools end right go to the bottom here
[03:21:31] we're going to add life cycle and in here we're going to get on response
[03:21:39] and from here we're going to get the result and network and now what we're going to do here is
[03:21:47] we are going to check if the last message that is in this cycle because
[03:21:52] this is a cycle right this is not going to be linear it's not going to go uh
[03:21:58] using the terminal then create or update files and then read the files and we're
[03:22:03] done no it has access to all three tools equally and it will create its own plan
[03:22:10] it might use them 50 times in a row that's why in the prompt we tell it when
[03:22:16] you are finished when you know that you're done go ahead and return the task
[03:22:21] summary so now in the life cycle we are going to uh extract the last message
[03:22:27] from the assistant and we are going to check if that message includes the task
[03:22:32] summary if it does we will break the cycle and then we can go ahead and do
[03:22:39] these steps where it actually shows to the user what it generated
[03:22:44] so in order to implement that part we have to go inside of utils here in the inest where we have get sandbox let's
[03:22:51] export function here last assistant text message content
[03:22:59] it will accept a result which is a type of agent result from inest agent kit
[03:23:06] let's go ahead and do const last assistant text message index which will be
[03:23:13] resultput find the last index extract the message and we are going to
[03:23:20] find the index of a message whose role is assistant so we know okay this is
[03:23:27] what assistant said last then let's extract the actual message content from
[03:23:32] that index so result dot output last message index
[03:23:39] as a type of either text message again from ing inest agent
[03:23:46] kit or unde so it can even not exist right and then
[03:23:54] let's return message question mark.content and we're going to add a turnary below
[03:24:00] it if type of message.content is string we're going to simply render
[03:24:08] message.content otherwise we will do message.content
[03:24:14] domap get the individual inner content and simply return that inner contents
[03:24:22] text and then we're going to join it all in a single string and then finish the
[03:24:28] outer turnary by adding or undefined here like that
[03:24:34] perfect i'm going to pause the screen just so you can double check your code
[03:24:39] now let's go ahead here and let's use that inside of here so I'm going to do
[03:24:45] const last assistant text just this last assistant uh let's
[03:24:54] do message text and in here we're going to call our last
[03:25:00] assistant text message content which we can import from the utils and
[03:25:06] pass in the result like this and let me just see if I did something
[03:25:13] incorrectly here so uh life cycle on response
[03:25:18] uh I have to end this here there we go perfect and then we're going to check if
[03:25:25] last assistant message text and if we have network
[03:25:31] if last assistant message text doinccludes
[03:25:37] task summary
[03:25:43] add to the network state in the summary key last assistant message text like
[03:25:51] this and then outside of this outer if clause return result
[03:25:59] and let me just see what I did incorrectly here so I think I have to end this
[03:26:05] maybe like that let me just try and fix this quickly
[03:26:11] so let's see i think I don't need this part do I need this okay so that was the extra perfect
[03:26:21] so basically what we're doing here is we're extracting last assistant message text using our util last assistant text
[03:26:28] message content which simply finds the index of the last message whose role was assistant and then if it is type of text
[03:26:35] message and if it's string it just returns that content but there is obviously a special type of message
[03:26:41] where it can be an array of strings so in that case we simply join that into a single string using a very simple method
[03:26:48] and then once we parse that message if we have network available and if we have
[03:26:56] last assistant message text and if that message includes task summary which is
[03:27:01] our rule here right to return that if it's done we store the network state
[03:27:07] data summary last assistant message text and we return the result and what we
[03:27:14] will be able to do now is the following go below this entire coding agent and
[03:27:19] create a network the network will be create network
[03:27:26] from inest agent kit like this and in here
[03:27:33] go ahead and add the following the name coding agent network
[03:27:40] agents will be our coding agent or whatever we called it it we called it
[03:27:46] code agent so let's just add it here code agent max iteration
[03:27:54] will be 15 now this will basically
[03:28:00] this is a number that will uh limit how many loops the agent can do so what is a
[03:28:07] loop as I explained previously the agent can pretty much do things indefinitely
[03:28:13] if it wants to right we need to find a way to tell it to stop so we are doing
[03:28:19] that currently using the task summary right but there has to be some kind of
[03:28:24] limit we cannot really let it go forever so I'm going to say if you reach 15
[03:28:30] iterations you're doing something wrong you should have already been done and this is too much and I have to stop you
[03:28:37] because you will use all of my open AI credits that's what max iterations is
[03:28:44] now let's add a router here which is an asynchronous method and it can extract
[03:28:50] network let's add the summary here to be network
[03:28:58] data summary and if we have the summary we are going to break this network
[03:29:04] otherwise we are going to return uh the agent and the agent will be code agent
[03:29:13] like this there we go so this is how we break the loop if we detect this summary
[03:29:20] in the network state we break the network otherwise we return code agent
[03:29:26] right so the code agent will call itself many times until finally we detect
[03:29:32] there's a summary if we detect a summary we say great you are done perfect so now
[03:29:39] I have a bunch of these errors that I have to fix so I'm going to go ahead and just see did I maybe remove an important
[03:29:46] bracket or something uh because something seems to be wrong here i'm going to start by trying to reload my
[03:29:52] window just to see if that maybe fixes it looks like it did not fix it so I'm
[03:29:58] going to go ahead and see uh exactly what I did wrong
[03:30:04] okay I think I found it it's all the way uh up here uh somehow this happened i'm
[03:30:11] not sure how so create network
[03:30:17] there we go perfect and now the only error in our
[03:30:22] app is this unused network variable everything else seems to be working no errors seem to be flying around perfect
[03:30:30] so once I have this network what I can now do is I can run this network instead of running the actual code agent so I
[03:30:38] will remove this now and I will do con result that comes from the entire
[03:30:44] network and I will simply pass in event data and
[03:30:49] I believe it was value that we pass so let's go ahead and do that and then in
[03:30:54] here what we are able to do is this part can stay the same and in the result part
[03:31:01] uh we can actually do the following we can show each file that was changed so
[03:31:08] next to sandbox URL let's do it like this
[03:31:14] so URL is sandbox URL the title will be for now just a
[03:31:21] fragment files will be result state data
[03:31:26] files and summary will be result state data
[03:31:32] summary so right now these are a type of any depending on the version you use
[03:31:37] maybe they will even become errors don't worry we will add the types later so if
[03:31:43] we've done this correctly we should have working code now especially after you
[03:31:50] change this and if you add this prompt I believe this should be working now keep in mind uh it is hard to be reliable and
[03:31:58] deterministic with AI agents i might get one result and you might get a completely different result and that
[03:32:05] will actually quadruple if you're using a different AI model than me
[03:32:12] so again the my biggest advice is use the same model I'm using use the same
[03:32:19] open AI you even put the same temperature this will make it much more easier for you uh to have the same
[03:32:26] result as me let's try it out now so uh
[03:32:31] I have my app running here and I'm going to go inside of here and I will create
[03:32:38] um create a calculator app let's try this and let's invoke a
[03:32:45] background job let's see maybe it fails immediately maybe it works we're going to see uh let me refresh the runs are
[03:32:53] they working are they not working not sure okay it seems
[03:33:00] it seems like there is some kind of error happening here so let me just try
[03:33:06] and debug this all right so what I did is I've shut
[03:33:12] down the npx inest cli i have shut down npm rundev and I restarted both of them
[03:33:18] so do that shut them down and restart them and let's see what's going on so I
[03:33:23] managed to get the sandbox ID that's a good start it means we successfully started the sandbox and now we are
[03:33:30] running the code agent and you can see here we are running it with all the tools available the tools to use the
[03:33:36] terminal the tools to create or update files the tool to read files and now it will
[03:33:44] use those tools so there we go it used create or update files let's see what it
[03:33:49] created it created calculator.tsx tsx and then it imported that calculator
[03:33:55] from that file at least that's what it says it did and it returned back the
[03:34:00] code sandbox URL let's check it out i'm going to click here and if it worked we
[03:34:06] should now be seeing a simple calculator app fingers crossed and looks like
[03:34:12] something went wrong so what happened here what happened is that it forgot to
[03:34:19] use use state but here's the cool part for you maybe this doesn't didn't even
[03:34:25] happen i don't know right uh it can behave randomly so how do we fix this
[03:34:32] thing well we can fix it in two ways we can fix it by uh making the prompt even
[03:34:38] more strict right we can find the places where I add for example in here I added
[03:34:45] you must never add use client to layout tsx line 13 maybe it's confused because
[03:34:52] of this it reads this part and then it gets confused let's remove that part
[03:34:59] let's search for use client again file safety rules again never add use client
[03:35:04] to app layout tsx maybe it gets confused by this so I'm going to remove this
[03:35:11] where it says never add use client because it seems like u it is avoiding
[03:35:16] to add use client in that case i have another instance of use client
[03:35:22] here where it says if building a form or or interactive element include proper state handling and add use client to the
[03:35:28] top perfect that's a good example only add use client at the top of files that was react hooks or browser APIs never
[03:35:36] add it to layout tsx so I will remove this part as well simply because I feel
[03:35:41] like it is leading it away from using use client properly
[03:35:47] so let's see if our next iteration will be better so I will add it again create
[03:35:52] a calculator app uh and if it doesn't work then we can instruct it in this
[03:35:58] prompt further right and as I said for you maybe it worked first try i don't
[03:36:03] know that's kind of the part about building this type of apps um you have to simply rely on luck sometimes right
[03:36:11] sometimes the agent will perform very well sometimes it will perform very bad
[03:36:17] and the better this models get the better your results will actually be and
[03:36:23] as I said uh your prompts will also get better with time right so let's go ahead
[03:36:29] and see if this was any better let's see if it added use client this time and
[03:36:36] there we go i have a working calculator app generated by AI can you believe that
[03:36:46] AI has generated this now as I said I have no idea what kind of result you are
[03:36:52] going to get right i don't think you will get the same result as me your might have some colors your might not
[03:36:59] work again if it doesn't work again you know you can try and go inside of here
[03:37:04] and then explicitly tell it you know uh be mindful of use client where it needs
[03:37:12] to be added right you can tell it that and then it definitely won't make that mistake
[03:37:18] or you know uh read through my prompt and see if there's something you don't
[03:37:23] like here or maybe paste my entire prompt inside of chat GPT and tell it to
[03:37:28] improve it somehow so for me I removed those couple of lines for use client
[03:37:37] perfect uh let's try build a landing page
[03:37:43] so you can now pretty much you know you're pretty much let's say finished when it comes to backend side you can
[03:37:50] now only improve these tools and improve the prompts so what we're going to do next is we're going to implement saving
[03:37:57] this to the database and we're going to implement creating a summary of what it just created so we can save that to the
[03:38:04] database and kind of return a message back to the user and if you want to uh
[03:38:09] you can instruct it to use some package like use drag and drop use framer and
[03:38:15] then you will see it use the terminal tool so let's see if it managed to create a landing page there we go and
[03:38:22] may I say a pretty good landing page right very impressive perhaps you should
[03:38:29] try with the landing page example because it doesn't use any use client or things like that i'm very very impressed
[03:38:36] by this is better than I expected so let's try telling it to use framework this time build a landing page use
[03:38:43] motion package let's try this
[03:38:49] so in here we can see that now it is using terminal and we can see the result
[03:38:54] added three packages right so let's see if it actually used uh that or something
[03:39:00] else i think you can also click on the code agent right before it uses the terminal and click on the output and in
[03:39:06] here you can see npm install framer motion so that's what it run i'm not sure if that's the newest version of
[03:39:13] framer maybe this won't even work i don't know but let's click on get sandbox URL let's click here
[03:39:21] and let's see maybe it will be broken yeah looks like this doesn't work it should use motion package not framer
[03:39:28] motion so as I said uh it's not perfect right you can break it every now and then but you can also improve it just as
[03:39:35] easily right as I said Claude Sonnet 3.5 is by far the most reliable coding agent
[03:39:42] because it just it is up to date with everything it just knows everything right but you will hit limits very very
[03:39:50] soon so your best option for now is to create this kind of app right using open
[03:39:57] AI and simply improve the prompt as much as you can so I did this myself and I am
[03:40:04] not a prompt engineer so you can definitely create this better than me your starting point uh should be this
[03:40:11] you're a senior software engineer and the most the other important part is this give it a very important ending so
[03:40:19] this should be your ending everything in between after before final output you
[03:40:24] can change so I wrote all of this with the help of AI and I basically added more things as I saw uh they as I saw
[03:40:31] some things fail so for example sometimes it attempted to run dev itself or build so I told it you must never do
[03:40:40] that right it's always working uh so yeah you can learn how to prompt a
[03:40:45] little bit better and you will get better results or you can simply use a newer model so how about we try build a
[03:40:52] conbon board use react beautiful
[03:41:01] drag and drop let's try that maybe we will have some uh better results with this package
[03:41:08] so this is the result of the query to build a conbon board as you can see the
[03:41:14] first terminal command actually failed and we can actually see the error here
[03:41:20] so let's go ahead and scroll down here error error unable to resolve the dependency and it probably told it that
[03:41:28] it needs to use uh legacy peer depths you can see this retry this command with
[03:41:35] d-force or legacy peer depths and then what happened is it simply retried that
[03:41:42] and you can see then it worked so that's the power of ingest and that's the power
[03:41:47] of returning the result of the terminal tool right so we tell it the command
[03:41:54] failed and we tell it why it failed so that way it knows how to retry and my
[03:42:00] get sandbox URL uh was this what seems to be a working conbon board
[03:42:08] test amazing it seems to have some issues it's missing a prop set here but
[03:42:16] honestly other than that pretty damn good look at this
[03:42:22] amazing right it even highlights where it's going to land very very cool uh
[03:42:29] great so I think that marks the end of this chapter uh till we finish this project we will add some methods to
[03:42:36] improve the failing builds right we will allow the user to tell the AI like hey
[03:42:42] you forgot to add use client so it understands what happened previously and then it can just easily fix the issue
[03:42:49] that's at least what we are going to attempt to do so even if something fails uh we will allow the user to instruct
[03:42:56] the AI and tell it hey it failed can you please fix it because you know I saw lovable fail i saw replet fail i saw v
[03:43:03] 0ero fail all of these apps fail right they are just AI it's a it's a language
[03:43:09] model after all right so it can definitely fail but I think it is super
[03:43:14] impressive given the fact that we built it so soon and so fast amazing amazing
[03:43:20] job let me mark all of these things as complete here and now let's go ahead and branch out so
[03:43:26] 07 agent tools i'm going to go ahead and create a new branch
[03:43:35] 07 agent tools i'm going to stage all of my changes
[03:43:42] 07 agent tools i will commit and I will publish my branch as always you have a
[03:43:50] completely free code rabbit extension you can install inside of Visual Studio Code if you wanted to review your files
[03:43:58] and now let's go ahead and let's open a pull request so we can merge our changes
[03:44:03] and so we can review them here with a summary
[03:44:09] and here we have the code rabbit summary so we have enhanced agent capabilities with multi-tool multi-agent network for
[03:44:16] sandbox interactions including terminal commands file operations and summary extraction we also introduced a
[03:44:23] comprehensive system prompt outlining coding standards and environment constraints for improved code generation
[03:44:30] and consistency perfect so that's exactly what we did and in here we even
[03:44:35] have a sequence diagram of how it happens so once the background job is
[03:44:40] triggered we can see that now the coding agent can use the terminal create or update files or read files as needed and
[03:44:47] then the tools return results using std out using files contents or anything
[03:44:54] else and depending on that the code agent is either calling another tool or
[03:44:59] finally it returns with the last message which includes the task summary tag
[03:45:07] signaling that it is over and then we can return the sandbox URL so in here it
[03:45:13] actually uh recommends not doing a double turnary instead ending early here
[03:45:19] so that's quite a good suggestion we could possibly do that then below
[03:45:25] here it fixed a typo to agent that is definitely a mistake great uh and in
[03:45:32] here is something quite interesting so what I do here is if I fail I simply
[03:45:40] return an error so I practically never store anything if it fails but in here
[03:45:49] it recommends actually doing partial saving right so if there is at least
[03:45:56] some files which were successfully created save them but still throw an error so quite a good suggestion but in
[03:46:04] my experience if it fails on one file it will fail entirely because uh this
[03:46:11] doesn't mean that it wrote incorrect code if it throws an error here it means
[03:46:16] it lost access to the file system that's why I'm not exactly worried about this i
[03:46:21] will pretty much always expect it to be able to write all files it needs but
[03:46:27] very good suggestion here to handle partial success i will look into that
[03:46:32] let's go ahead and let's merge this pull request here i'm not going to delete the branch as always so I have access to it
[03:46:40] right here and now that we are here let's go ahead and go back inside of our
[03:46:46] main and let's go ahead and synchronize our changes and that should officially
[03:46:52] mark the end of this chapter just a sanity check here there we go we just
[03:46:57] merged 07 amazing amazing job we are now ready to start building our UI see you
[03:47:05] in the next chapter in this chapter we're going to implement
[03:47:11] the messages entity this will include creating the actual message Prisma
[03:47:16] schema the fragment Prisma schema and then we're going to modify our current TRPC procedures and our background jobs
[03:47:23] to use those new schemas and save user prompts and AI responses in their
[03:47:29] appropriate models so let's start by creating a simple message schema in
[03:47:36] order to do that we have to go ahead and visit our schema file before you do that as always confirm that you're on your
[03:47:42] main branch and if you are unsure if you have any unsynchronized changes you can always click this and confirm and just
[03:47:48] make sure that chapter 7 is your last merged change here great now let's go
[03:47:54] ahead inside of Prisma and schema.prisma if you have a folder with migrations
[03:48:00] here you can delete it because we're going to remove pretty much everything inside of here right so we're going to
[03:48:06] create a whole new schema now so let's go ahead and create a model message
[03:48:12] inside create an ID which will have a type of which will be a type of string
[03:48:18] is going to be an ID with the default value of uyu ID after that let's go
[03:48:25] ahead and create a content which will be a type of string let's go ahead and add a role which will be a type of enum so
[03:48:33] let's create an enum message type and let's give it uh my apologies not
[03:48:40] message type message role which can be a type of user or assistant
[03:48:48] and then you can go ahead and use that right here so simply assign the role to be message ro just like that and now
[03:48:57] we're going to do what I started to do which is the message type
[03:49:02] so the message type will either be a type of result or a type of error
[03:49:09] and let's go ahead and give this a type of message type so in case the AI response fails we are going to treat it
[03:49:16] as an error meaning that the AI will simply return uh I wasn't able to do
[03:49:23] this generation for whatever reason please retry and now let's add the usual created ad
[03:49:30] field which is a type of date time and the default value of now and let's add
[03:49:36] updated ad which is a date time as well and it has a special decorator updated ad which is a very cool decorator
[03:49:43] because what it does is it will automatically update this build when we update the message model and now let's
[03:49:51] go ahead and let's create a fragment model so the fragment model
[03:49:58] will also have an ID of string and the default value of UU ID and it will have
[03:50:03] a relation to the message so let's add a message ID to be a type of string and it needs to be unique
[03:50:10] now let's add a message here to be a type of message give it a relation decorator targeting the fields message
[03:50:18] ID which we defined above referencing the ID field in the message
[03:50:24] model and let's add on delete here to be cascade so if this message gets deleted
[03:50:30] the fragment gets deleted as well and now we just have to fix this error by
[03:50:35] adding a proper relation here in the message so the message does not have to
[03:50:40] have a fragment if the user is sending a message there will be no fragment only for the AI response will there be a
[03:50:48] fragment that's why we're going to create a fragment field and we're going to make it a type of fragment but it's
[03:50:55] going to be optional like this and then let's go back inside of the fragment model and let's create a sandbox URL to
[03:51:02] be a type of string the title to be a type of string and files to be a type of
[03:51:10] JSON so this is quite cool uh it's very nice that possess allows this and it's
[03:51:15] perfect for our use case because files is not exactly something that in my
[03:51:20] opinion makes sense to create a whole new model for because it's just a simple mapping of the file path and the content
[03:51:28] and it can be pretty much infinite in size well obviously not infinite but you know what I mean so I think this is a
[03:51:35] very good use case of using JSON in posgress and then we can just copy the created ad and the updated ad from the
[03:51:42] model above just like that now in here you should have no errors and again make
[03:51:47] sure that you're using the Prisma extension simply so you have the syntax
[03:51:53] highlighting and it will tell you in advance if you've done anything incorrectly here so what we have to do
[03:51:58] now is we have to push this so let's go ahead and shut down our app make sure you have shut down your ingest server as
[03:52:05] well and I will now run npx prisma migrate dev and let's just wait a second
[03:52:11] for this to connect to our database so I have gotten an error in your case
[03:52:18] you might not get an error but I think this is because yes it detected some
[03:52:23] drift your database schema is not in sync with your migration history that's because I told you to manually delete
[03:52:29] the migration folder this is not a problem we are working with development data here so let's use npx prisma
[03:52:36] migrate reset first and let's just reset the entire thing so let me just confirm
[03:52:41] this um and even if this doesn't work you can always just create a new
[03:52:46] postgress database and then just go instead of environment and just use a new database URL right that's like the
[03:52:52] ultimate brute force you can do so after I've done my migrate reset I will try
[03:52:58] migrate dev again and this time with no problems I'm going
[03:53:03] to call this message-fragment and there we go just like that we have
[03:53:09] created new schema here and now you can go ahead and run the npx Prisma studio
[03:53:15] and in here you should see the fragment and the message as the models meaning it successfully created that perfect so now
[03:53:22] let's go ahead and let's actually use these things so what I want to do now is I want to go inside of source and I want
[03:53:30] to create a new folder called modules so I like to have a module-based
[03:53:36] structure in my application so instead of having my procedures written here
[03:53:41] randomly I will have them in their own module so I like to separate modules
[03:53:47] either by large chunks of my application like homepage landing page pricing or by
[03:53:55] entity models that I have in my database so for example let's go ahead and let's create messages in here so inside of
[03:54:03] here I will keep everything message related so for example one of those things would be all the things that go
[03:54:10] on the server uh regarding messages specifically all our procedures
[03:54:16] so now that we are inside of here we're going to import uh initc router or
[03:54:22] create tRPC router from trpc init and let's export const messages router here
[03:54:28] to be create trpc router and then inside of here let me just quickly check inside
[03:54:34] of my TRPC routers app i seem to have this existing one called invoke so now
[03:54:40] what we're going to do is we're going to create a create procedure so this will be accessed through as message.create
[03:54:49] this is how you will call this that's why it's called create and not create message because it would be redundant
[03:54:55] message dot message create or create message right makes no sense so let's
[03:55:00] add a base procedure which will of course be a protected procedure later on in the tutorial for now it's perfectly
[03:55:06] fine to be a base procedure let's go ahead and define an input here and I'm
[03:55:11] going to set this to be uh the value it can be the value it can be the prompt i
[03:55:17] think value is good enough and let me just import Z from zod let's go ahead and set it to be a string
[03:55:25] and let's give it a message is required error
[03:55:32] great and then let's go ahead and let's chain mutation here is going to be
[03:55:37] asynchronous let's dstructure the input from here
[03:55:43] like this and then inside of here what we're going to do is we're going to
[03:55:49] create a new message by using await Prisma from lib database and then go
[03:55:57] ahead dot message dotcreate and pass in the data inside and let's
[03:56:03] add the content to be input value here like this and let me just see what else
[03:56:09] do I have to add inside because I already forgot how my schema looks like so I have to add a role and I have to
[03:56:15] add a type so my role here will be user and my type here will be result right
[03:56:22] there's no loading this is an instant message created by the user perfect so I think I actually don't even
[03:56:29] need to uh put that in any type of constant i think this works just fine
[03:56:35] and what I'm doing after this is I'm actually invoking my background job so
[03:56:40] let me go inside of the routers here and let me just copy this part
[03:56:45] inside of procedures and let's go right here so let me import inest from the inest client let me show you my imports
[03:56:52] a bit simply so you're on the same page there we go
[03:56:58] and obviously we're going to have to change this as well it makes no sense to be called test uh and uh this is what we
[03:57:05] should actually do we should keep this as created message or new message and then simply return created message
[03:57:14] simply so our API response has some kind of well response for the user back
[03:57:20] perfect now that we have the basic message router created with some basic
[03:57:26] validation here let's go ahead inside of TRPC routers and let's remove everything
[03:57:32] inside of here and then in here add messages messages router you can import the
[03:57:39] ingest you can you can remove zone you can remove inest and you can remove the base procedure
[03:57:45] just like this and this is how we're going to add all other uh module related things inside so
[03:57:53] later when we add fragments it will be fragments router and we will control all
[03:58:00] procedures inside of its own module right like this great so now obviously
[03:58:08] we need to fix some things in our page I believe so let's go inside of source app
[03:58:14] page and in here this is now create message
[03:58:19] this will be TRPC dot messages.create and the on success is the same in here
[03:58:25] we can just say on success message created
[03:58:31] and then let's go ahead and let's use create message is pending and create message.mmutate
[03:58:37] just like that so right now uh this should still work exactly the same right
[03:58:43] let's go ahead and just quickly try it out uh just to make sure we didn't accidentally break something so npm
[03:58:50] rundev in one npx inest cli latest dev in the other one let's go and we can
[03:58:55] install the new one if it appears it's okay and let's go ahead and open local host 3000 here and I'm going to do
[03:59:03] create a landing page simply because this is the simplest thing that most likely won't go wrong there we go looks
[03:59:10] like it is created so I'm going to click invoke a background job here
[03:59:16] and looks like message was created i'm going to go inside of my inest developer server here and I'm going to wait for
[03:59:23] this to complete and here we have it it is complete and
[03:59:29] quite a nice result i'm always impressed by its landing pages it seems to have uh
[03:59:35] gotten that it seems to have gotten very good at creating landing pages uh great
[03:59:41] so looks like everything is still working and now what we have to do is while we are storing the messages from
[03:59:49] the user we are not storing the messages from the AI so in order to keep track of
[03:59:54] that how about we extract the messages here by using use query from tanstack query
[04:00:02] so just make sure you add this import here pass in tRPC do messages and I just remembered we didn't create any so let's
[04:00:09] simply go inside of the messages router which is inside of your modules here and simply create uh let's call this get
[04:00:16] many base procedure the input doesn't really matter for now
[04:00:23] let's just do a query here again it's going to be an asynchronous method
[04:00:30] and in here what we're going to do is get the messages to be await Prisma
[04:00:35] message find many and how about we do order by and let me just see I have to
[04:00:43] use updated at or created at let's use ascending and return the messages
[04:00:50] like this and just like that we have our get many procedure so now we can go back here and add it there we go get many
[04:00:58] this will be query options here and then inside of here let's go ahead
[04:01:03] and do it below the button json.stringify messages null 2 so now you can see that
[04:01:11] I just created this create a landing page with the ro user so if I go ahead
[04:01:17] and do create a red landing page and invoke this background job and refresh
[04:01:24] this page you can see that now I have create a landing page and after that I have a create a red landing page so let
[04:01:31] me go inside of my procedures and change the updated ad to be descending and refresh and then the newer message
[04:01:38] appears at the top and if you want you can wait for the result but uh you know it's it's not that important right now
[04:01:45] but it definitely created a red landing page great so now again I'm expecting
[04:01:52] that besides having these steps to get sandbox ID create our update and then
[04:01:58] finalize i also needed to save this entire thing to the database so that we can access it from the UI and not from
[04:02:05] the inest developer server so let's go ahead back inside
[04:02:10] of ingest functions here and then we're going to create a whole new step here at
[04:02:17] the bottom so after we get our sandbox URL we have to go ahead and actually
[04:02:23] save this to the database so let's do await step.r run save result
[04:02:32] asynchronous method like this and in here let's return await Prisma dossage
[04:02:40] whoops we have to import Prisma from lib database so just make sure you add this import
[04:02:46] and we're basically going to save the content so prisma dossage.create
[04:02:52] the data will be the following content is going to be result state data summary
[04:03:01] and role will be assistant and type here will be result like this and let's also
[04:03:09] extend it a bit further by also creating the fragment relation let's pass in the
[04:03:16] sandbox URL here uh sandbox URL doesn't exist did I do something incorrectly in
[04:03:23] my schema or is it just the syntax that I didn't finish it definitely does exist
[04:03:28] here so perhaps I just have to do result actually sandbox URL like this
[04:03:36] oh my apologies this is not how you do it create and then sandbox URL sandbox
[04:03:43] URL and let's go ahead and add the the title of the fragment to be just fragment
[04:03:49] and files can be result state data files
[04:03:55] there we go so now let's go ahead and try and do
[04:04:00] this again so use a simple prompt again build a blue landing page so basically
[04:04:07] something simple and then wait for this to finish and after it finishes you
[04:04:12] should now see another step happening here which is to save the result in
[04:04:19] Prisma it should create a assistant message and it should also create a fragment with the sandbox URL and all
[04:04:27] the files that it created there we go so we have the save result
[04:04:33] step and now if I go back here there we go you can see I have a new message here
[04:04:40] at the top the content includes the task summary created a fully responsive
[04:04:45] production quality blue themed landing page in app page tsx the layout includes a navbar hero section favorites pricing
[04:04:52] contact form and footer uh and we don't really have access to the sandbox URL
[04:04:58] here that's because what we have to do if we want to see that is go inside of the message router and we have to add
[04:05:04] include fragment true and after you do that you will see the entire fragment
[04:05:10] content so you will see the entire source code actually and you will see the sandbox URL so if you try adding
[04:05:18] that here we now have the blue landing page and that is basically what we now
[04:05:24] have to do so uh let's remove the fragment for now we can easily add it
[04:05:30] later because I'm not sure if we need it and it's taking up a lot of space uh perfect so this is what I actually
[04:05:36] wanted to do for this chapter i wanted us to add the messages router and I think that we can do one more thing
[04:05:44] while we are here and that is the following we can go inside of ingest
[04:05:49] here instead of functions and let's just change this right let's stop calling it hello world let's go ahead and call this
[04:05:57] uh code agent the ID will be code agent and let's also change the event to be
[04:06:06] code agent run like this and now just make sure that
[04:06:13] you go back inside of your modules messages server procedures here and when you invoke it make sure to change this
[04:06:22] like that or any other place where you do this make sure to change it for me it's only one place code agent run uh
[04:06:31] okay and now we have to also go inside of app API ingest route and we have to
[04:06:37] replace this with code agent there we go go ahead and refresh
[04:06:44] uh if it's still stuck you can always shut this down and I would recommend
[04:06:49] shutting both of them down and let's go ahead and refresh again
[04:06:56] build a green landing page message created and I recommend waiting
[04:07:04] it out just to confirm it works since we just changed this to be a code agent function
[04:07:12] there we go seems to work quite well and I think that is it for this chapter oh
[04:07:18] this one's nice uh we've basically created the message model the fragment model which basically
[04:07:25] puts it puts us in a position where we can start creating proper UI around this
[04:07:30] because uh by having the fragment and by having the message we can create the
[04:07:36] file explorer we can create the I frame where we render the URL and we can
[04:07:41] create the message containers on this side and while we are here it is important to do uh one more thing go
[04:07:49] inside of your functions.TTS in the ingest here and after you do uh the
[04:07:56] result from the network run define an is error constant and it will be an error
[04:08:01] if we don't have result data summary result data.state state my apologies
[04:08:11] state data summary or if object do keys result
[04:08:18] state data files or an alternative empty array.length
[04:08:24] is equal to zero so if any of those two are missing it means something went
[04:08:31] wrong so inside of here when we save the result what we're going to do is we're
[04:08:36] going to check if is error we're going to return
[04:08:41] content whoops my apologies we're going to uh
[04:08:46] return await Prisma message create data content
[04:08:54] something went wrong please try again
[04:09:02] like this let's give it a role of assistant and let's give it a type of
[04:09:08] error like this there we go so we do an early return if we detect it is an error
[04:09:14] so we don't create the fragment if we don't have the information to create it
[04:09:20] and the one thing I completely forgot about is the types here so right now files is a type of any summary is a type
[04:09:28] of any right and while this seems to not create any problems for us I want to show you that there is a way so that you
[04:09:34] can properly type your entire network state because I think that is important and it will make your project more
[04:09:41] maintainable so let's go ahead above the uh code agent here and let's create an
[04:09:46] interface agent state and let's go ahead and do the following let's make a
[04:09:52] summary a string and let's create files which can be mapped as a record string
[04:09:58] string but I don't like this simply because there is a way to make it uh closer to what we expect and it's
[04:10:04] basically opening an object and then defining path as the key and simply the
[04:10:10] content as a string i think this more closely resembles what we expect rather than record string string
[04:10:18] now that we have the agent state uh we just have to find all the places to use it so starting with uh oh yes I really
[04:10:26] don't like this we should not name our function and our agent the same so how
[04:10:31] about we rename one of them let's call this uh code agent function
[04:10:40] like this and then go back inside of your uh source app API inest route code
[04:10:46] agent function code agent function like this way safer like that okay now let's
[04:10:55] go ahead and use the agent state instead of the code agent here we can open uh
[04:11:01] pointy brackets and pass it inside so that's step one then the next place we
[04:11:06] can use it is in the tool create or update files so In here we have step and
[04:11:12] network and you can see that files here are undefined even though we added it to the agent state that's because what we
[04:11:17] have to do here is we have to define this step as a type of tool from inest agent kit so just make sure that you
[04:11:25] import the type tool from inest agent kit i think you can specify type like
[04:11:30] this let's go back here so it's going to be a type of tool dot options and pass in
[04:11:38] agent state inside and then when you hover over files you will see that it
[04:11:43] has the correct state so that's the second place and the third place is in
[04:11:49] the network here so open this up agent state
[04:11:54] like this and then data dos summary is a type of string now and you will see that
[04:11:59] you now have autocomplete and if you type something else
[04:12:04] you should get an error now right so when you clearly define your state it is much stricter and you will not be making
[04:12:10] any mistakes now uh perfect so I think that this is it for this chapter then uh
[04:12:18] and let me just check uh how does this look like summary so this looks like it
[04:12:24] doesn't need anything because life cycle seems to infer properly from create agent agent state here right so if I
[04:12:31] change this I'm getting an error perfect great so I think that this could be it
[04:12:39] for this chapter so I'm going to stop here let me just fix this fix this description coding agent
[04:12:45] like this and of course yeah if you want to you can change the name of this i told you you can always go inside of
[04:12:52] your let me find the folder sandbox templates
[04:12:58] toml file and you can change the name here and then simply run inside of this
[04:13:03] folder E2B template build great so now that we have this let's go
[04:13:10] ahead and open a pull request if you want to you can also you know try another one just to confirm it works
[04:13:16] because we changed again the name of our function but at this point I think you know how to fix it but let's just try
[04:13:23] build a yellow landing page just for sanity check so I don't end the
[04:13:29] chapter and things are broken and seems to work just fine let's go
[04:13:36] ahead and see the yellow landing page perfect so let's go ahead and open a
[04:13:42] pull request so this chapter is 08 messages uh we just created the message
[04:13:48] schema fragment schema we're saving the user prompt and we are saving the user response perfect so I'm going to go
[04:13:55] ahead and I'm going to create a new branch 08 messages
[04:14:01] i'm going to stage all of my changes i'm going to add a commit message and I'm
[04:14:07] going to commit and publish the branch if you want to there is a free Code Rabbit extension which can help you
[04:14:14] review all of your files here now let's go ahead and go inside of our GitHub and
[04:14:21] let's go ahead and open a pull request and let's review with the summary and the diagram here
[04:14:29] and here we have a summary so let's quickly go over it so we end this chapter we introduced a new messages
[04:14:36] system allowing users to create and view messages with associated metadata and
[04:14:41] fragments messages now display additional details including message type and role and we did some refactors
[04:14:49] such as we streamlined the backend procedures and routing for the message management and we removed the legacy
[04:14:56] user and post data structures perfect so in here we have the diagram but nothing
[04:15:02] much has been changed from last time except this time we have additional step before we invoke the code agent run
[04:15:10] which is that we save the user message in the database and we have one more step in the background job where we save
[04:15:17] the uh message to the database to the Prisma here great and in here we have uh
[04:15:23] some comments but all of these things will be changed the on error will be
[04:15:28] added here later this will basically not be in this component at all so that's the only reason why I keep you know not
[04:15:35] fixing this comments uh not because they're wrong they're completely right but it's not the component they are
[04:15:41] going to be in anyway this is just for demonstration right we are now going to start and build the proper UI in here uh
[04:15:48] I'm pretty sure this is not needed simply because uh inest events have their own try catch methods so let's go
[04:15:55] ahead now uh and go through the rest of these so in here it recommends pagionation that's something we can look
[04:16:02] into later but yes it's very easy to add pagionation with Prisma as you can see
[04:16:07] they have take they have skip and that's pretty much all you need here uh in here
[04:16:12] it recommends limiting the length of the message and that is definitely a good thing yeah we don't want any user to be
[04:16:19] able to spam our app with a huge number of tokens so we will have to limit this to some reasonable number this is a very
[04:16:25] good suggestion here let's go ahead and merge our pull request as always I'm not
[04:16:31] going to delete my branch instead what I'm going to do is now I'm going to go back to my main branch here and I'm
[04:16:37] going to click on synchronize changes and once that is finished
[04:16:43] I can go inside of my source graph and confirm messages are the last merged
[04:16:48] chapter amazing amazing job and see you in the next chapter
[04:16:57] in this chapter we're going to add the projects entity to our application so
[04:17:02] this chapter will be quite similar to the previous one where we introduced the message model so in this chapter we're
[04:17:09] going to add the project schema we're going to add message relations to that
[04:17:14] project and then we're going to create a new project on user prompt and the last
[04:17:20] thing we have to do is preserve project ID in background jobs so we know where
[04:17:26] to store that AI result basically each message needs to belong to a project so
[04:17:32] we can keep track of all of our uh AI generations so let's go ahead and start
[04:17:39] by adding a new Prisma schema as always confirm you are on your main branch and
[04:17:44] if you haven't synchronize your changes you should have 08 messages as your last
[04:17:49] merge so I'm going to go inside of Prisma i have some migrations here because we added them last time and now
[04:17:57] let's go above the message here and actually let's go above message type and above message ro and let's add a model
[04:18:04] project the ID will be the same as the message so you can add it here the name
[04:18:10] will be a string and then we're just going to have created at and updated at
[04:18:17] so we can add this and then down here add messages which will be a type of
[04:18:23] message like this and now we have to create an equal relation in the message model so let's go inside of the message
[04:18:30] model here and let's go ahead and add project ID to be a type of string and
[04:18:39] below that project to be a type of project give it a relation decorator
[04:18:46] with fields project ID references ID and
[04:18:51] on delete cascade so exactly the same as the message
[04:18:56] relation in the fragment right we are aiming for project ID field referencing the ID field in the project and if the
[04:19:04] project gets deleted the message gets deleted as well and then the fragment gets deleted as well perfect so now that
[04:19:11] we have this we have to push that to our database so I recommend shutting down
[04:19:17] both of your uh servers here and let's first do npx prisma migrate reset simply
[04:19:24] so we remove everything from our database because we have invalid data at
[04:19:29] the moment and once this is deleted let's go ahead and do npx prisma migrate
[04:19:35] dev and once it connects to the database let's go ahead and call this migration project
[04:19:42] there we go so I'm going to call this projects like this and that should apply
[04:19:47] the migration perfect now let's go ahead and start this server and let's start
[04:19:53] the ingest server here there we go so now what we're going to do is the
[04:19:59] following we're going to go inside of source inside of modules and let's copy
[04:20:05] the messages and paste it here and let's rename it to projects
[04:20:11] let's go inside of server procedures make sure you are inside of projects here we're going to change this from
[04:20:18] messages router to projects router like this and then we're going to modify uh
[04:20:24] how this works as well so for the get many change this to be projects
[04:20:32] and then in here await prisma.pro find many so that's the get many
[04:20:37] procedure for the project's router for the create here uh the value will
[04:20:44] also be uh the message right and actually I'm not even yeah so we are
[04:20:50] going to create a project by entering a prompt right so we are not going to
[04:20:56] create a new project and then give the project a name instead we're going to have a big landing page like this and we
[04:21:03] will simply say hey enter something like create a Netflix clone and then we're going to click create and this will
[04:21:10] create both the message and the project at the same time so in the create we
[04:21:16] actually only have the value right the prompt so that's going to be this so we're going to do the following const
[04:21:24] created project await prisma project create
[04:21:31] and then for the data uh we have to give a project a name so for this we're going
[04:21:36] to add a generator package to our project so let's go ahead and let's quickly do
[04:21:44] npm install random words slugs random word slugs you can of course use a
[04:21:52] billion other uh generators but this is the one I found that looks the most like
[04:21:58] uh all the other apps I can find so this is the version 0.1.7 in case you're
[04:22:03] interested and let's go ahead and use it now so let me just add it here generate
[04:22:08] slug from random words slug and then in here uh in here the name will be
[04:22:16] generate slug and pass in two words and let's go ahead and open the settings and
[04:22:22] pass in the format to be ke like this so that will be it for the name and now we
[04:22:30] have to immediately create the message so we can do that either uh separately like this or we can just pass in the
[04:22:37] message messages here and then open the create inside and you can just copy this
[04:22:44] exactly like this and then you can remove this and then we start the ingest here and
[04:22:52] besides sending the value we will also send the project ID to be created
[04:22:57] project ID and then in here you will have created project as the return and
[04:23:04] that's it that is our create method for the project's router so in here it would
[04:23:10] be a good idea uh to limit the length as our code rabbit suggested previously
[04:23:16] so let me add maximum here and let's add I don't know 10,000 maybe that could be
[04:23:24] the good upper limit message is too long this is not actually
[04:23:30] the message this is prompt right or value since this
[04:23:38] is called value so yeah it's either going to be required or if it's longer than 10,000 characters we're going to
[04:23:44] say okay that's too long uh you can of course modify this later to however you
[04:23:50] like perfect so you can of courseh also play around uh with this right it even
[04:23:56] has some more options which you can do but I found this to be sufficient and also in our Prisma schema the project
[04:24:04] name is not unique so it doesn't matter if there are conflicts with this right
[04:24:11] great so now that we have this we also have to modify
[04:24:17] our messages procedures here because right now uh they are not exactly
[04:24:24] working so let's go inside of the create base procedure here and for the value
[04:24:30] well we can just copy this just so we're on the same page here so either min or
[04:24:38] max and then let's also add project ID here which will be a type of string with
[04:24:46] a minimum value of one and a message project ID is required
[04:24:52] like this and then in here when we create a new message we will also assign project ID to be input project ID so
[04:25:00] each message will be stored in an individual uh agent in an individual
[04:25:06] project right and now what we have to do is also modify the ingest send to also
[04:25:12] accept project ID from input project ID like this there we go
[04:25:20] and now what we have to do is we have to modify our ingest functions to accept
[04:25:27] the project ID so let's go all the way down here to
[04:25:32] when we actually save the result and you can see we have an error here that's because this
[04:25:39] message is missing the project ID so project ID will be input my apologies it
[04:25:46] is event let me just find it uh how do I do this just a second event
[04:25:55] data value so this will be event data project ID like this and do the same
[04:26:03] thing here so basically you have to make sure that anytime a message is created you add
[04:26:10] project ID so you can highlight this part and use command shift F to search
[04:26:15] it through your entire project and basically every place that you find this it should include project ID so just be
[04:26:22] extra careful in the functions of the ingest here so you don't forget to uh so
[04:26:29] you don't accidentally misspell this right because there are no strict typings here we can improve this later
[04:26:36] on but for now just make sure you didn't misspell project ID when you extract it from event data
[04:26:43] perfect and now let's also do inest dot send simply so we see that we are
[04:26:50] sending project ID in all places that we need great so in here we are extracting it from the created project but in here
[04:26:57] it is from input project ID perfect so now what we have to do is we have to go inside of source app folder
[04:27:04] page.tsx and we have to modify this so this will no longer be creating messages and we no
[04:27:11] longer have to query messages we only did that before because we were interested in seeing them so we can
[04:27:16] remove this and instead we can do create project and this will be TRPC
[04:27:23] uh projects which doesn't exist the reason it doesn't exist is because we forgot to add it so inside of TRPC
[04:27:29] folder routers app add projects projects router and you can import it from
[04:27:35] modules projects server procedures basically this thing we just created
[04:27:41] and now that we have that we have a proper working projects create we can remove uh on success and instead we can
[04:27:49] add on error here and you can do toast error error dot
[04:27:55] message like that and now that we have the create project
[04:28:02] let's go ahead uh and let's do create project is pending and create project domutate and
[04:28:10] this will be submit like this and let's go ahead and just
[04:28:16] modify this slightly by adding height screen with screen flex item center and
[04:28:23] justify center and inside of here let's do this
[04:28:31] let's give this a class name maximum width 7 XL MX auto flex item center
[04:28:40] let's do flex call and gap Y for an
[04:28:46] items and justify center
[04:28:51] and now when I refresh this there we go it looks like a centered little prompt
[04:28:57] we can maybe expand this let's see maximum width
[04:29:03] okay uh screen let's just keep it at 7 XL like this and
[04:29:11] when you write test now and click submit uh it should say well nothing nothing
[04:29:17] for the success message but now what should happen is the following it should create well I have no idea what it's
[04:29:24] going to create now because I just typed test so let's actually see okay so the
[04:29:30] it returns the error something went wrong please try again right even though it generated something in the sandbox I
[04:29:36] have no idea what that is i think not a single file was modified yet so it's just an empty Nex.js page but if you
[04:29:43] look at your Prisma Studio now and if you actually start it so let's do npx Prisma Studio
[04:29:50] you should now have a project and inside of that project you should have There we
[04:29:56] go i have a name uninterested plastic so a new project was generated and I have two messages inside the first is the
[04:30:03] message from the user who asked test and then a response from the assistant which
[04:30:09] is a type of error because something went wrong because this is clearly not something the AI can generate right so
[04:30:15] let's try build a landing page and let's click submit and what should happen now
[04:30:21] in the Prisma Studio here uh this one is that we should have a new
[04:30:27] project now modern London with one message as you can see let's just
[04:30:33] refresh there we go so build a landing page by user we are running this and now
[04:30:39] we should have a successful example and all the messages for this project will
[04:30:44] be stored in that project so you can see how our submit data was a project ID and
[04:30:50] the value build a landing page so there we go now when I refresh this again
[04:30:57] I should get another message from the assistant with the task summary
[04:31:02] and this message also has a proper fragment and inside of here we should be
[04:31:08] able to see let's open in new tab this fragment and in here I have the sandbox
[04:31:15] URL and I should now see the landing page there we go perfect so now that we
[04:31:21] have this uh let's go ahead and just do one more thing so we can start building the UI for these messages so let's go
[04:31:28] inside of source app folder let's create a new folder called projects and in here
[04:31:35] open project ID so this is basically a dynamic URL part uh it's important how
[04:31:41] you write this so curly brackets uh square brackets are extremely important and then how you type inside is exactly
[04:31:49] how you're going to extract this value so be mindful of casing right
[04:31:55] now add page.tsx here and export uh do a page export like this
[04:32:03] and a div like this and this will be project ID and then to extract the
[04:32:09] project ID you simply create an interface props with params which are a
[04:32:14] type of promise and inside project ID which is a type of
[04:32:19] string and then in here you can extract the props you can extract the params
[04:32:26] and since this is a server component you can make this an asynchronous component and extract the project ID from await
[04:32:33] params and then you can set the project ID to be project ID as simple as this so how
[04:32:41] do I know that it is project ID how do I know it's not project ID 1 2 3 because
[04:32:47] of how we named the folder so if you name this with a lowercase letter I then
[04:32:53] you need to change this to lowerase letter I so be mindful of how you name this dynamic folder and once you've done
[04:33:01] that go back to your page here and go ahead and add router from use router
[04:33:07] from next navigation like this and then add the on success
[04:33:13] here which I'm going to transform into an arrow function simply because I prefer
[04:33:19] them no other reason we only need the data here and let's do router.push
[04:33:25] forward slash projects and then data id so how come that we have the data ID
[04:33:31] available for us because in the create procedure we return the created project so this
[04:33:39] new project that was just created we have its ID right here so now if I do
[04:33:46] build a blue landing page and click submit right here there we go i'm
[04:33:51] redirected to project ID and that new project and now in here I will load only
[04:33:57] the messages for that project so in the next chapter we will go inside of our
[04:34:03] modules messages procedures and we will modify the get many to accept a specific
[04:34:09] project ID and then query by project ID instead of loading all of them but that
[04:34:14] is for the next chapter amazing amazing job so you just added project schema uh
[04:34:22] in our uh entire application we will have one more model in the database but
[04:34:27] this is pretty much it amazing so we added the project schema message
[04:34:32] relations new project on user prompt and we preserve the project ID in background jobs now let's go ahead and commit this
[04:34:40] so I'm going to open a new branch 09 projects
[04:34:47] i'm going to stage all of my changes 09 projects and I'm going to click commit
[04:34:55] and let's go ahead and publish the branch and then let's go ahead and open a pull
[04:35:02] request just like that and let's see the summary of this chapter
[04:35:10] and here we have the code rabbit summary we introduced support for projects allowing users to create and view
[04:35:16] projects each with an associated initial message we also added a dedicated project page displaying the project ID
[04:35:23] for now this will later be the actual interface where you will chat with an AI and see the preview of your work and in
[04:35:31] here we have a couple of uh recommended changes so in here it recommends
[04:35:37] throwing an error in the background job if it cannot find the project ID and this is definitely the a good idea but I
[04:35:44] would rather we don't even invoke a background job if we don't have a project ID because where do we even save
[04:35:51] this message then right so we have to think of a different way to improve this but a good suggestion nevertheless
[04:35:59] and another suggestion regarding the migration since this is just you know development migration I really don't uh
[04:36:06] care about this one since it's not really dangerous for our use case so I'm going to merge this pull request and
[04:36:13] that marks the end of this chapter as always make sure you go back to your main branch and make sure you click on
[04:36:19] synchronize changes so you pull that new merge and once that is done you can go inside of your source control button
[04:36:26] here go inside of graph and you should see that we just merged projects amazing
[04:36:32] see you in the next chapter in this chapter we're going to develop
[04:36:38] the messages UI this will include creating the project view the messages
[04:36:44] container message card and the message form components and for the API changes
[04:36:50] we're going to have to slightly modify the get many procedures of our messages
[04:36:55] so before we do that let's go ahead and ensure that we are on the main branch and you can click synchronize changes
[04:37:01] just to make sure everything is up to date and in your source control your last merge should be 09 projects so I'm
[04:37:09] going to go ahead and go inside of source inside of modules messages
[04:37:15] procedures and in the get menu let's add the ability to add a project ID so I'm just
[04:37:22] going to copy the input from the below create procedure and I'm going to add it here and I'm going to delete the value
[04:37:28] because it's not required here only project ID is required and once we have
[04:37:34] the project ID we can extend this to add a where and let's go ahead and add
[04:37:40] project ID to be input project ID now let's go ahead and actually dstructure
[04:37:46] the input from here so we can use it properly just like this perfect so now
[04:37:52] we can load messages for an individual project let's go ahead and let's do that
[04:37:58] so now I'm going to go inside of source app projects project ID page.tsx
[04:38:07] and since this is a server component what we are going to do is we're going to leverage prefetching so I'm going to
[04:38:14] go ahead and do const query client and I will do await get query client
[04:38:22] from the RPC server and this is not a promise so we don't need a weight here
[04:38:30] you can usually see that if you type an await on something that does not need a
[04:38:36] weight you will see little three dots here which will tell you that it has no effect on this but you can also see that
[04:38:42] when hovering on something you will see that there is no promise wrapping this for example when I hover over params you
[04:38:49] can see that there's a promise of wrapping this so a weight makes sense right in here nothing would happen if I
[04:38:56] used await but we don't have to use await and let's now add a void TRPC
[04:39:02] which you can import from the TRPC server same same as get query client and let's go ahead and actually do void
[04:39:09] query client prefetch query tRPC dot messages get many query options
[04:39:19] and pass in the project ID which we structure from right here
[04:39:24] perfect so now what I want to do is I also want to add inside of my modules
[04:39:30] projects server procedures I want to add a get
[04:39:36] one like this and I want to add an input here and I want to call this ID ZR
[04:39:47] with a minimum value of one and a message ID is required
[04:39:53] so should you call this ID or should you call this uh project ID well since this
[04:40:00] is regarding fetching a single project in my opinion it is kind of redundant to
[04:40:06] call the property project ID here uh and let me just see what I did incorrectly
[04:40:11] here so this is not how you open this you should add Z.Object and then wrap this in parenthesis like
[04:40:18] this this is the input and then in here you can go ahead and import uh extract
[04:40:25] this input and you would find existing project here to be await prisma project
[04:40:31] find unique like this and you would just do where
[04:40:40] ID is equal to input ID and then go ahead and return the
[04:40:46] existing project and you can add if there is no existing project throw new TRPC error which you can import from
[04:40:54] TRPC server and the cool thing about this is that you have strictly typed
[04:41:00] codes so in this case this would be not found and then we can specify our
[04:41:05] message which can be project not found great so now we have a procedure to
[04:41:12] fetch an individual project by its unique ID so we can leverage the find
[04:41:17] unique which uses the index ID now let's go back inside of the page
[04:41:23] here and let's also prefetch for that so TRPC projects get one and instead of ID
[04:41:32] uh instead of project ID we are using the ID field because just think of it when we are fetching messages it makes
[04:41:39] sense that the prop is project ID because it's referring to an entirely new entity but when we are fetching
[04:41:46] projects we already know that ID is referring to the project ID that's why
[04:41:51] in my case it makes no sense to call this project ID we already know it's a
[04:41:57] project at least that's kind of my idea of naming a convention here in here basically we are doing this just in case
[04:42:03] you were confused but yeah you can do a shorthand operator if the key and the value are named the same so now we are
[04:42:11] prefetching these two which means that we can now create our project view component so I'm going to do that by
[04:42:18] going inside of modules projects and I will create a new folder called UI
[04:42:25] and inside of here I will create views
[04:42:30] and then inside of here I will create project- view.tsx
[04:42:36] and I will mark this as use client and I will export const project view
[04:42:42] and in here I will create an interface props project ID and I will call this a
[04:42:49] string in here you could also technically use ID since we know what
[04:42:55] it's referring to but I originally built the project using this so I just don't want to alter the source code
[04:43:03] and now in here we are going to rely on getting the data from use suspense query
[04:43:09] and from using const tpc usepc
[04:43:15] like this trpc dot projects
[04:43:20] and here I have it get one query options and
[04:43:25] pass in the ID to be project ID and let's go ahead and remap this to project
[04:43:31] then let's copy this and let's change this to messages get many and this will
[04:43:37] use the project id key and we are going to remap this to messages and now in
[04:43:44] here we can return a div project JSON stringify project and then
[04:43:51] below JSON stringify messages null too
[04:43:57] just like that just make sure you've marked this as use client And now inside of the page here what you
[04:44:03] can do is you can change this to be hydration boundary which you can import from tanstack react query you can pass
[04:44:10] the state here to be dehydrate again from tanstack react query and simply
[04:44:16] pass in the query client then inside of here render the project
[04:44:21] view component and pass in the project ID to be project ID just like that and
[04:44:28] there actually is another reason why I don't want to use ID here simply because ID is reserved for u HTML elements right
[04:44:37] you often see things like form ID and then something so because of that I want
[04:44:43] to explicitly use project ID here and let's go ahead and wrap this inside of suspense which you can import from React
[04:44:53] and let's give it a fall back of loading like this there we go
[04:45:01] perfect so now if you have your app running and
[04:45:06] if you go to localhost 3000 and if you create a new project here
[04:45:12] build a yellow landing page and click submit
[04:45:18] the project ID was just loading for a second and as you can see the first thing we have is for me it's freezing
[04:45:25] tent that's the random name that we generated and then immediately below that I mean after that we can see an
[04:45:31] array of messages the first one is build a yellow landing page by the user and in
[04:45:36] a couple of seconds we will get another message which will basically be the response and here we have it the task
[04:45:42] summary it created a landing page blah blah blah perfect so this works just fine and it leverages pre-fetching in
[04:45:49] the server components just be careful that your query options are exactly the same in the prefetch as they are in the
[04:45:55] use suspense query so they need to be identical so make sure you didn't accidentally mess them up
[04:46:03] now I'm going to add some resizable panels inside of this project view you already have this installed when we
[04:46:09] added all Shatsen components so you can import all of these from components UI
[04:46:16] resizable so you can control-click to confirm that you have it it is inside of source components UI resizable and now
[04:46:24] let's go ahead and actually build uh our resizable panels so I'm going to give
[04:46:29] this div here a class name of height screen i'm then going to add a resizable
[04:46:35] not handle panel group and I'm going to wrap these two elements inside
[04:46:44] i will give this a direction of horizontal and I will then add a resizable panel
[04:46:53] and let's go ahead and wrap the project in one resizable panel and then another
[04:46:59] one for the messages like this let's go ahead and give this one a default let's
[04:47:05] actually collapse this default size will be 35 minimum size will be 20 and let's
[04:47:12] give it a class name of flex flex column and the minimum height of zero
[04:47:18] and now let's go ahead uh and let's do the following in between these two
[04:47:23] resizable panels add a resizable handle and add width handle
[04:47:30] like this and for this resizable panel give it a default size of 65 and a
[04:47:39] minimum size of 50 like this so now you
[04:47:45] should have this type of resizable panel and you can already see how this is going to look in here we're going to have our messages and in here we will
[04:47:52] have the project preview right now it is the opposite but you know it's I just wanted to use it as an example so that's
[04:47:58] how we're going to do that and by default you can see it has what I think is a kind of fair ratio this size for
[04:48:05] messages this side for the preview you can of course change the default size to whatever you like uh but you know just
[04:48:13] make uh the the the total number of these two panels needs to add up to 100 so you know just make sure you are using
[04:48:19] the proper calculations great so now that we have this let's go ahead and let's develop this side of the
[04:48:28] resizable panel so I'm just going to change this to be to-do preview
[04:48:33] and this here will be our messages container
[04:48:40] so right now we have an error because messages container does not exist yet so now let's go ahead and do the following
[04:48:47] i'm going to still stay inside of projects inside of UI and I will create
[04:48:52] components now you're probably wondering why am I creating a message container
[04:48:58] messages container.tsx inside of the projects module when I
[04:49:03] clearly have the messages module right here well it's not the name that decides
[04:49:10] where you put something in module-based architecture it is its purpose and this
[04:49:16] specific messages container purpose will only be used inside of the project ID
[04:49:21] page right so this project's project ID page is obviously the project module so
[04:49:29] just because we are rendering a component called messages here messages container doesn't mean that it belongs
[04:49:35] in the message uh module right but something that's re reusable like the
[04:49:42] message API that belongs in the message uh module but messages container is just
[04:49:48] a container to render messages in the project so that's why this is the place
[04:49:54] I'm putting it in the name doesn't matter I can call this project message
[04:49:59] container maybe that would be uh a bit more visually attractive but just to
[04:50:05] explain why I'm putting that here now let's go ahead and let's build the messages container so we are actually
[04:50:12] going to do the following messages container and then I'm going to copy a couple of
[04:50:19] things specifically this because this is where I will load the messages if you
[04:50:25] can it will it will always be better to load the messages to use it to use use
[04:50:30] suspense query in a deeper component because the deeper component you use it
[04:50:35] in uh the the faster the page will load and I'm going to show you why in a
[04:50:42] second so let's call this use TRPC from TRPC client like this and in here we
[04:50:49] need an interface which I can just copy from the project view here
[04:50:54] and let's go ahead and destructure the props and get the project ID like this
[04:51:00] and now we have the messages here so let's just return a div with JSON.stringify
[04:51:07] messages there we go and now we can import the messages container here from components
[04:51:16] messages container and we can remove the suspense query for messages like this
[04:51:22] and pass in the project ID here to be project ID and now what's important is
[04:51:29] that you wrap this inside of suspense as well and give this a fallback of
[04:51:36] loading messages like this so now the cool thing that's
[04:51:43] happening I don't know if you will now see this and yes uh yeah so let me try
[04:51:49] and demonstrate yeah it's kind of hard uh to do right
[04:51:54] now perhaps because I don't need this what if I comment this out yes you can
[04:51:59] see that when you comment this out in the project view the page loads much quicker that is because if we are using
[04:52:07] a use suspense query inside of the project view then it means that this suspense will fire and that blocks the
[04:52:15] entire page you can see that while that big loading is active let me just write loading project
[04:52:22] so while this loading project text is visible the entire page is blocked but
[04:52:28] if you move the suspense in an deeper cont uh component like the message container like we just did with loading
[04:52:35] the messages here and wrap that inside of suspense so let me now simulate by commenting this out you can see that we
[04:52:43] are not blocking the entire view only the messages view so that's why I told
[04:52:49] you that it will be faster it's not really faster it is just visually faster
[04:52:54] so we are going to do the same thing for loading the project so yes for now we can actually remove this because we will
[04:53:00] not be loading the project uh inside of the project view let me just move the
[04:53:06] suspense right here perfect so now let's go inside of the message container and let's develop it
[04:53:14] i'm going to start by giving the most outer div a class name of flex flex
[04:53:19] column flex one and a minimum height of zero i'm then going to add another div
[04:53:26] with a class name flex one minimum height of zero and overflow y auto and
[04:53:32] then inside of here another div with a class name padding top padding top two
[04:53:39] and padding right of one and then finally inside of here I will go over my messages i will get the individual
[04:53:46] message here and I will render a new component so in here we're going to
[04:53:52] render message card component and you can remove the JSON stringify here now
[04:53:57] let's give this a key of message do ID let's give it content of message.content
[04:54:04] roll of message roll fragment of message
[04:54:09] fragment and now we have a problem fragment is not loaded here so let's go ahead and fix that by going inside of
[04:54:16] messages get many procedure it's inside of uh modules messages server procedures
[04:54:22] and simply do what we did in the previous chapter add include make sure you're doing this instead of get many
[04:54:28] add include fragment true like this
[04:54:34] and now let's go back inside of the messages container here and as you can see now we no longer have that problem
[04:54:41] right so now message fragment exists let's add created at here to be
[04:54:46] message.created at just is active fragment for now to be
[04:54:53] hardcoded to false on fragment click will be an empty arrow function and the
[04:54:59] type will be message.ype now let's go ahead inside of the components and create the message card
[04:55:07] again we are doing this inside of the projects module because even though
[04:55:12] these components are called message they relate more to the product to the project entity than they do to the
[04:55:18] message entity and inside of the message card component we are now uh going to do
[04:55:24] this the uh the following first let's create the props content which is a
[04:55:29] string roll which is a type of message roll you can import from at generated
[04:55:35] Prisma so this is the generated folder of Prisma which you can find in your source folder and you can see that you
[04:55:42] don't really touch this folder right you don't modify this folder because it is
[04:55:47] automatically generated every time you do npx prisma generate or npx prisma
[04:55:53] migrate dev which in background runs npx prisma generate right you can always do
[04:56:00] npx prisma generate yourself this will simply update the entire prisma right so
[04:56:06] in case yours didn't exist now it will exist so message ro was directly
[04:56:12] generated from our schema message role so if yours is called something else
[04:56:18] you're going to have to import something else same thing for fragment from message here and same thing for message
[04:56:24] type so basically content ro fragment which can be null created at is active
[04:56:31] fragment which is a boolean on fragment click which accepts the fragment as the value and type which is a message type
[04:56:37] now let's go ahead and let's export the message card here and let's assign all
[04:56:43] of those props from above and let's dstructure them all here
[04:56:49] perfect now inside of this let's go ahead and do the following if roll is
[04:56:54] equal to assistant we're going to return a paragraph assistant
[04:57:01] otherwise we are going to return a paragraph user and let me just fix my uh
[04:57:09] typo here so we have this uh I don't think I need this there we go
[04:57:15] like this and it's okay that all of these things are unused now let's go back to the messages container and import message card from dot / message
[04:57:23] card let me just separate my imports here no need for use client in this component simply because the uh project
[04:57:31] view where it's rendered is already use client so its children will be as well
[04:57:37] and as you can see I have two messages the first one is from the assistant and the other one is from the user and I
[04:57:44] think that in this case we would actually need the opposite to happen so let's go inside of the messages
[04:57:50] container go inside of messages get many and change the order by to be ascending
[04:57:56] so the first one should be from the user and the second one should be from the assistant all right now let's go inside
[04:58:02] of the message card and let's actually develop this so let's do the user one first because I believe it is a little
[04:58:08] bit easier so we're going to do user message here and it will have one prop
[04:58:16] which is content so let's pass in content here and we're going to develop this uh just above this con user message
[04:58:27] and let's create an interface uses me user message props like this and then
[04:58:33] just extract the props here it's just content and in here return a div with a
[04:58:39] class name flex justify and padding bottom of four PR of 2 PL of 10 and in
[04:58:47] here add a card from components UI card you already have this as well it comes
[04:58:54] with chat UI you can find it in source components UI card now inside of the
[04:59:01] card render the content and give the card a class name of rounded large
[04:59:08] background muted padding three shadow none border none maximum width of 80%
[04:59:15] and break words like this so the user message will be
[04:59:23] rendered every time the user sends a message and we should be able to see
[04:59:28] that now build a yellow landing page that was my first message and you can see how my message is moved into this
[04:59:34] corner we are now going to render the assistant output so in order to do that
[04:59:40] we will render the assistant message like this
[04:59:48] assistant message and the assistant will have uh some different props so we're
[04:59:56] going to pass the content to be content fragment to be fragment
[05:00:01] it will have created at it will have is active fragment
[05:00:09] and it will have on fragment click and it will have a type basically all
[05:00:16] the other props are related to the assistant message so now let's go uh
[05:00:22] below the user message let's create an interface assistant message and in here
[05:00:28] we can just add all of those props content fragment which can be a type of fragment or null created at which is
[05:00:34] date is active fragment which is boolean on fragment click and type i'm not sure
[05:00:40] but maybe these are identical to message card props uh it doesn't have roll so yeah one less
[05:00:46] prop i'm not sure if this is the best way to do this but you know I think it's fine now let's go ahead and actually do
[05:00:54] const assistant message like this let's destructure assistant
[05:01:00] message props oops yeah I should call this props yes like this and then inside let's just add
[05:01:08] all of those things content fragment created at is active on fragment click
[05:01:14] enter and type and inside of here we are going to do the following let's add a div with a
[05:01:21] dynamic class name which means open curly brackets and import CN from lib
[05:01:26] utils if you don't remember this but we got this when we installed shot cnui and
[05:01:31] I told you we are going to use this when we need some dynamic classes and this is the first time we need that so the way
[05:01:38] you use this library is very simple you open it up as a function it can accept
[05:01:43] an infinite number of parameters so the first parameter the second parameter the third infinite number
[05:01:51] what I like to do is I like to reserve the first one for my static class names so flex flex column group ex 2 and
[05:02:00] padding bottom of four and then in the second argument I like to do dynamic ones if type is equal to error I'm going
[05:02:10] to render it differently i'm going to render text red 700 and on dark mode
[05:02:16] text red 500 like this and then inside of here I'm going to add a div with a
[05:02:23] class name of flex item center gap 2 pl
[05:02:29] 2 and margin bottom of two now I'm going to add to-do add logo because we don't
[05:02:36] have it yet and I'm going to add an image component here uh actually we can
[05:02:41] do that only when we have the logo so let's add a span for now and our app name in my case this will be vibe text
[05:02:49] small and font medium like this then copy this span and in
[05:02:56] here you're going to need to install npm install date fns this will be used to
[05:03:03] parse dates and let me show you my package json date fns 4.1.0 zero
[05:03:10] and I'm going to import something from date FNS so import format
[05:03:18] from date FNS like this and inside of here I'm going to format
[05:03:26] created at like this and I will format in this format
[05:03:37] like this and then I'm going to slightly modify this to be text extra small and text
[05:03:45] muted foreground and then then I'm going to give it an opacity of zero and I'm
[05:03:51] going to give it transition opacity and since I have given this outer parent
[05:03:58] div a group class name I can leverage that by doing the following i can do
[05:04:04] group colon my apologies group dash hover so when the group is hovered
[05:04:10] change the opacity to 100 like this and that's how I'm going to make this appear
[05:04:17] when we hover on the parent element perfect and then outside of this div
[05:04:24] let's go ahead and let's actually render the content so div class name pl 8.5
[05:04:31] flex plex column and gap y of four and inside of here a span with content
[05:04:38] inside and let's go ahead and make sure we are using the assistant message we are perfect and there we go you can see
[05:04:45] build a yellow landing page and then vibe answers at this time which only
[05:04:50] appears when I hover with a task summary like this perfect so
[05:04:57] now let's go ahead and continue uh developing this uh and let me just see
[05:05:05] so in here we have flex item center gap 2 PL2 margin bottom of two okay i think
[05:05:14] I think this is okay i am just this this spacing seems a little bit odd i'm not
[05:05:21] sure this is how it's supposed to be but yeah go ahead and try and collapse your page a bit it should work fine it should
[05:05:27] normally break words it shouldn't add any scroll bars except the
[05:05:32] the the one from up down right that one should appear but no one on the x-axis should not happen uh great so now let's
[05:05:40] go ahead and let's obtain our app logo so head to the assets page you can see
[05:05:47] the link on the screen or you can use the link in the description and in here you can find logo.svg
[05:05:54] i found this logo from logo Ipsum so these are amazing placeholder logos you
[05:06:00] can use for your projects uh and I use them in pretty much every project they are amazing so I slightly modify them to
[05:06:08] match the color scheme of the project you can download them or you can copy the SVG since the code is in SVG and you
[05:06:16] can then go inside of your project and what I like to do is go inside of public create a new logo svg here and then I
[05:06:24] click this open file using VS Code standard text binary and I paste it inside and save it and that creates the
[05:06:31] logo or you can just download it as a file normally without all that trouble so now let's go ahead and let's add our
[05:06:39] logo to our message card specifically in the assistant message I added a to-do
[05:06:44] here now let's add an image here from next image so make sure you have added
[05:06:50] this import here and then we're going to add the following source will be forward/lo.svg
[05:06:59] alt will be vibe width will be 18 height
[05:07:04] will be 18 and class name will be shrink zero and let's go ahead and try again
[05:07:12] and there we go so now this space makes more sense because the logo perfectly pushes the text to be aligned with the
[05:07:20] content right here amazing and don't worry about this task summary tag we
[05:07:25] will get rid of that later uh using something else but this is basically how
[05:07:30] our chat will look like and if you're wondering the colors don't look exactly as your demo don't worry we're going to
[05:07:37] change the entire theme of the project later but this is what I wanted to achieve so now what I want to do is I
[05:07:44] also want to add a little uh message on the bottom here i mean a little form on
[05:07:51] the bottom uh but just before I do that I also want to create a fragment
[05:07:57] component so after we render the span content let's check if we have the
[05:08:02] fragment and if type is equal to result only then are we going to render the
[05:08:09] fragment card the fragment card will accept three props the fragment itself
[05:08:16] is active fragment and on fragment click and we can create the fragment just
[05:08:24] above here so first the props fragment card props fragment is active
[05:08:31] fragment and on fragment click and then the fragment card component so let's
[05:08:37] just use the props and extract them here and then inside of here we're going to
[05:08:43] return a button but a normal HTML button like this we're going to give it a
[05:08:50] dynamic class name using the CN library in the first argument I will add flex
[05:08:57] items start text start gap two border
[05:09:04] rounded large background muted width fit
[05:09:10] padding three hover bg secondary and
[05:09:16] transition colors and then I'm going to check if is active
[05:09:21] fragment And I will do the following background primary text primary
[05:09:29] foreground border primary and hover bg
[05:09:34] primary like this and on click here I will call on fragment click and pass the
[05:09:41] fragment as the prop inside of the button itself I will add
[05:09:46] code to icon so from lucid react let me just fix this
[05:09:54] uh invalid fragment end here i don't need this there we go the code to icon
[05:10:01] will have a class name of size four and margin top of.5
[05:10:08] i will then open a div with a class name flex flex column and flex one and inside
[05:10:16] of here I will have a span which will render the fragment title and the class name text small font
[05:10:23] medium and line clamp one below this another span with a class name of text
[05:10:31] small and the text preview i think we should already start to see
[05:10:38] this because this message from the AI assistant has the fragment and it is not
[05:10:43] an error so we can see it right here make sure that you are doing this on a
[05:10:48] successful response so you have the fragment generated in your database if you are unsure if you still can't see it
[05:10:55] npx Prisma studio to show you what I'm talking about so your message whatever
[05:11:00] one you're doing should have a fragment you can see how some of my messages don't have fragments
[05:11:07] because they are by user or they are errors but the ones that are successful have a fragment right so that's what you
[05:11:14] need to do you basically need to create uh a background job with a successful generation something that has a fragment
[05:11:23] so now after the preview here outside of this div I'm going to add another div
[05:11:28] with a chevron write icon from lucid react with a class name of size 4 so the
[05:11:35] same import place as code to icon and let's go ahead and give this a class
[05:11:41] name flex items center justify center and margin top of 0.5
[05:11:49] and I think that marks the end of the message card component i think we have everything we need now the only thing I
[05:11:56] don't like is that this doesn't have the pointer cursor it doesn't look clickable
[05:12:02] but you don't have to fix that by adding the pointer to uh this because this is
[05:12:08] already a button so what we're going to do is we are going to change the global CSS so that it shows the pointer when
[05:12:15] this is hovered like this i mean not this one but you you get the idea right
[05:12:20] perfect so now what we can do is we can create the form here at the bottom and
[05:12:25] that will uh complete the message container so let's go ahead and go inside of the
[05:12:32] components and let's create the message dash form.tsx
[05:12:39] so this will be rendered at the bottom of the message container let's go ahead
[05:12:45] and just copy the props from the previous components and let's export
[05:12:51] message form inside of here go ahead and assign the
[05:12:57] props and destructure the project ID and return a div message form and now let's
[05:13:05] go inside of the messages container and now we have to render this so I'm going
[05:13:10] to render it uh after the last div here i'm going to open a new one with a class
[05:13:16] name relative padding 3 pt1
[05:13:21] and then I'm going to add message form and I'm going to pass in the project ID
[05:13:28] project ID like this so make sure you have added this import and now at the bottom you
[05:13:34] will see message form in order to complete the message form
[05:13:40] component we're going to have to install a new package
[05:13:45] react text area autosize so go ahead and install this and I'm going to show you
[05:13:51] the version so package JSON 8.5.9
[05:13:57] that is my version and now let's go inside of the message form and we're going to need a couple of things from
[05:14:04] React hook form so use form and then we're going to need Zod resolver from
[05:14:10] hook form resolvers zod and if you're worried where do these packages come from we already have them cook form and
[05:14:19] form react cook form so all of this already exist and they came with chatnui
[05:14:25] when we added all components and the new one is this one text area auto size from
[05:14:31] react text area auto size and besides this let's just see uh what else
[05:14:40] do we need let's also add use state from react like this let's also add zod
[05:14:50] and let's add post from sonner and let's also add some icons so that's going to
[05:14:56] be arrow up icon and loader two icon from lucid react and from tanstack query
[05:15:01] we need use mutation use query and use query client from tanstack react query
[05:15:07] then let's add cn from lib utils use trpc from at tpc client the button
[05:15:15] component and form and form field from components UI form this is another shhatsenui
[05:15:22] component and when you installed that which you did using the d-all command
[05:15:28] you also got use form and you got the zod resolver and also zod and that is it
[05:15:35] for now so now let's define form schema here to be z.object and what
[05:15:43] you should actually do is you should visit one of your procedures in messages specifically find the create procedure
[05:15:51] and you should copy the value from here so you have the limit right so like this
[05:15:59] now how you're going to call this value string um I really don't know so you can
[05:16:06] do value you can do content whatever you want and let's go ahead and do the following now that we have this form
[05:16:12] schema con form use form pass in Z.infer infer type of form schema like this and
[05:16:21] add resolver here to be zod resolver and pass in the form schema object and the
[05:16:28] default values will set the value to be an empty string by default
[05:16:33] great now that we have the form let's build the UI so the outer div will be
[05:16:39] the form element from here from components UI form and we have to pass
[05:16:46] the entire object that we created here using use form and then inside we need a
[05:16:54] native HTML form element like this and in here we need the following we need
[05:17:00] onsubmit to be form handle submit and then we have to create a custom submit
[05:17:07] form so const onsubmit here we'll accept the values which are basically this so
[05:17:13] you can copy this from above and for now just console log the values
[05:17:20] the reason we are doing this infer is because when you hover over you can see that it is exactly what you define here
[05:17:27] so now use that onsubmit and pass it here so now this onsubmit will only
[05:17:33] trigger this which will actually initialize the network call when the validation passes so that's why we are
[05:17:40] wrapping it inside of here perfect and now let's go ahead and do a class name
[05:17:46] here cn relative border
[05:17:53] padding four padding top one rounded extra large background sidebar dark bg
[05:18:01] sidebar and transition all like this and then if is focused
[05:18:09] which doesn't exist yet we were going to do shadow extra small and for show usage
[05:18:16] we are going to do a rounded top none so now let's go ahead and just quickly uh
[05:18:22] fix these things so for is focused it is an easy fix all we are going to do is
[05:18:27] add a new use state here with is focused and set is focused with the default
[05:18:32] value of false from use state react and for the show usage I'm going to manually
[05:18:39] set it to false for now so now you should have no errors here and
[05:18:45] periodically you can check on this just to see how it looks great now that we have this let's go ahead and add the
[05:18:52] form field component which is a self-closing tag just make sure you have
[05:18:57] imported it give this a control of form
[05:19:02] give it a name of content and give it a render of field
[05:19:09] like this and inside use the text area auto size self-closing component in here
[05:19:15] you can immediately spread everything you have from the field above and then go ahead and give it the following and
[05:19:22] give it an onfocus and on blur to modify the set is focused state like this and
[05:19:30] the name should be value my apologies so already when you hover over this I'm not
[05:19:35] sure if you can notice but that's there's an ever so slight shadow change to the entire object now we have to fix
[05:19:43] this so it doesn't look so weird so let's go ahead and give this a minimum rows of two and a maximum rows of eight
[05:19:52] and then a class name adding top four bore resize none border none width full
[05:20:01] outline none background transparent and a placeholder of what would you like
[05:20:09] to build and then let's go ahead and do
[05:20:14] on key down get the event and check if event key is
[05:20:20] equal to enter and open parenthesis we are also holding
[05:20:27] control key or meta key so this will basically be control enter we prevent
[05:20:34] the default and we do form handle submit onsubmit
[05:20:40] oops onsubmit and pass the event as well so the onsubmit is this
[05:20:48] just like that so now uh outside of this
[05:20:54] which is form field I believe yes outside of form field but still inside of the form let's go ahead and do the
[05:21:00] following let's add a div with a class name flex gap x2 items end
[05:21:10] justify between padding top of two then another div with a class name text
[05:21:18] 10 pixels text muted foreground and font
[05:21:24] mono and just write test here simply so you see where that is so it's right here
[05:21:29] at the bottom so this will now be the following it will be a uh keyboard
[05:21:36] sign i think this is for keyboard the the short name for keyboard uh render a
[05:21:42] span inside and render the following sign like this and then enter and that will
[05:21:51] turn uh like this the command sign and enter
[05:21:57] now let's style it the class name will be ML auto pointer events none inline flex height five
[05:22:07] select none items center gap one rounded
[05:22:13] just rounded border background color muted px 1.5 font mono text 10 pixels
[05:22:24] font medium and text muted foreground ground and then let's go ahead outside
[05:22:31] of the KBD and let's do NBSP
[05:22:36] to submit so basically command enter to submit we
[05:22:42] are telling the user how to submit and now outside of this div add a button
[05:22:48] element and this button element will do the following it will render arrow up icon which we already have imported from
[05:22:56] Lucid React there we go and now we're going to style it give it a class name
[05:23:04] of CN size 8 and rounded full like this
[05:23:12] there we go this is how it's going to look like and now we need to add some dynamic things here so let's start by
[05:23:20] adding our create message mutation so we need to add PRPC here use PRPC
[05:23:31] and then we need to add create message from use
[05:23:36] mutation ERPC messages create mutation options
[05:23:42] like this and then you can extract the following
[05:23:47] you can then extract const is pending to be create message is
[05:23:55] pending const is disabled to be is pending or if not form form
[05:24:05] state is valid so if form state is not valid like this and let me actually move
[05:24:12] these two to the bottom here simply so I have all of these things in one place
[05:24:20] and now that we have the create message mutation let's go inside of the onsubmit and let's make it an asynchronous method
[05:24:27] and let's do await create message dot mutate async and pass in the value to be
[05:24:35] data actually this is values so values do value and the project ID like that
[05:24:44] perfect and now let's use the is pending and let's use uh the is is disabled so
[05:24:52] first things first to the text area auto size disabled if is pending
[05:25:00] like that and then let's go ahead down to this button and the button will be a
[05:25:07] little bit different so this one will be disabled if is disabled so be careful
[05:25:12] for the text area auto size we only disabled if it's pending so only if the
[05:25:18] network request is pending but disabled will be for this so you can do is button
[05:25:23] disabled just to don't so you don't make a mistake there we go uh and let's also do
[05:25:30] if is button disabled background muted foreground and border like this
[05:25:36] and then inside of here a turnary if is pending in that case we are rendering
[05:25:42] the loader two icon which we already have imported with a class name of size
[05:25:47] four and animate spin otherwise we render the arrow up icon like this there
[05:25:55] we go so now make sure that you you know restart your server here actually I will
[05:26:02] restart the entire project as well so npm rundev npx inestdev
[05:26:08] i will refresh this page here and I'm going to add build a blue landing page
[05:26:15] and I will press command enter and there we go you can see that that has submitted this for a second it was
[05:26:21] loading we still have to do the cleanup function but if I look in my inest developer server you can see that this
[05:26:28] is successfully running amazing and if I refresh here I should actually see my
[05:26:34] new message here build a blue landing page perfect so now let's go ahead and just add some onsuccess things to happen
[05:26:41] in the mutation options of the create message right so what should happen after we submit so the first thing that
[05:26:47] should happen is on success here once we get the data of this new message let's
[05:26:53] go ahead and let's first do form.reset like this so make sure that form is initialized above and then let's do
[05:27:01] query client which uh I'm not sure do we have it we don't so let's let me just
[05:27:06] add const query client to be use query client so you have this imported from tanstack
[05:27:14] react query so in here what you're going to do is queryclient.invalidate
[05:27:20] invalidate queries and then pass in TRPC messages get many query options
[05:27:28] project ID data project ID or you can
[05:27:33] use the project ID from here yeah maybe that's even easier to do and then you can use the shorthand operator
[05:27:41] that's the first thing we are going to invalidate then the second thing uh we don't have
[05:27:47] yet so I will add a to-do reinvalidate or invalidate uh usage status we don't have this yet
[05:27:54] but we will have it later and now add on error here get the error
[05:28:01] and do toast dot error error dossage
[05:28:08] and I will add a to-do redirect to pricing page
[05:28:15] if specific error there we go and the only thing I don't
[05:28:22] have left here is the use query and I will remove it for now because we don't really have the entity we need to call
[05:28:31] and I think that for now this is it i think for now this is everything uh we
[05:28:38] can do here and there we go we have a response now created a fully responsive production quality blue themed landing
[05:28:44] page perfect so now what I want to do is just to end this chapter one more thing here I don't like how uh the first thing
[05:28:54] is when I load the page you can see I have to scroll all the way down and the
[05:28:59] second thing is when I scroll the text visibly clips here you can see how it's cut so let's fix those two things and
[05:29:06] let's end the chapter both of these things will be in the messages container so make sure that you have some messages
[05:29:13] and you can zoom in a little so you have the scroll bar like I do
[05:29:19] the first thing will be a very simple self-closing div just above the place where we render the message form inside
[05:29:25] of this relative div and give it a class name of absolute
[05:29:30] minus top minus 6 left 0 right zero
[05:29:37] height of six background gradient to bottom
[05:29:43] from transparent to oops to dash background forward
[05:29:49] slash70 pointer events none what this will do is
[05:29:55] it will create an ever so slightly white shadow i'm not sure if you can see it but it kind of melts the the overflow so
[05:30:04] it doesn't look as obvious that the text is clipping here if you want to you can
[05:30:09] improve this and change this to two background and then you can see you can't you can't see the clipping at all
[05:30:16] it's like it fades into some kind of fog right so just a slight effect to make
[05:30:22] this look better so it doesn't clip now let's do the thing that when we load we scroll to the
[05:30:28] bottom here so in order to do that we first have to add a bottom ref so let's
[05:30:35] do that here const bottom ref will be use ref from react with a default value
[05:30:41] of null and the type of HTML div element like this let me just move this to the
[05:30:49] top like that and then what we are going to do
[05:30:57] is we are going to change this to be use effect
[05:31:07] which you can import from react
[05:31:12] and let's first do the following const last system or let's do last assistant
[05:31:18] message and do data Find last my apologies messages find last
[05:31:27] search through the messages and find the message whose role is assistant and
[05:31:34] that's how we are going to find the last message that the assistant sends so make sure you're using the find last API here
[05:31:41] and if we are able to find this last assistant message what we are going to
[05:31:46] do first is we are going to set the fragment uh to that assistant message
[05:31:52] now we don't have this yet so actually I'm not sure if we can do
[05:31:58] that so let me just do to-do uh and let's do set active fragment right so
[05:32:05] we're going to do this uh well maybe in this chapter maybe in the future i I will see but let's add messages for now
[05:32:12] like this and then let's go ahead and add another use effect
[05:32:22] and in here we will do messages.length
[05:32:28] and we're going to check if bottom ref question mark scroll into view like this
[05:32:39] and let me just check i think um that
[05:32:44] for now this is okay if I do a refresh here
[05:32:50] uh looks like it's not working so So it should be scrolling me to the bottom but
[05:32:55] it is not probably because I never added that so let's go ahead outside of here
[05:33:03] add a self-closing div and give it a ref of bottom
[05:33:09] ref so now when you refresh there we go you can see how you scroll down immediately
[05:33:16] perfect um so now um yes I think I'm going to end the
[05:33:23] chapter here simply because it's already been an hour so we're going to end here
[05:33:29] and in the next chapter we're going to wrap this up by adding is active fragment functionality we're going to
[05:33:35] add some loading states while we wait for the response and we're also going to
[05:33:40] add the header here so that we can click the back button to go back to the landing page and so we can uh access
[05:33:47] some settings here and see the project name great so we've already made some
[05:33:52] great progress here and you can add something uh like this if you want to see the error state
[05:34:01] and now you can see how the error state looks like when you send it something that it cannot generate it will simply
[05:34:07] tell you something went wrong and it highlights the red color perfect so I'm very very satisfied with this so we've
[05:34:14] done this we've done this this this and even more than this now let's go ahead
[05:34:20] and open a new branch and merge this so 10 messages UI i'm going to open this
[05:34:28] i'm going to create a new branch 10 messages UI i'm going to stage all of
[05:34:37] my changes and I will do 10 messages UI and I will commit and I will publish
[05:34:43] the branch a quick reminder that there is a free code rabbit extension which you can use to improve your code quality
[05:34:50] and now I'm going to go and open this pull request here and we're going to
[05:34:56] review the summary of this chapter and everything we did
[05:35:02] and here we have the code rabbit summary we introduced a chat interface for
[05:35:08] project pages including a message list message input form and support for assistant and user messages with styled
[05:35:15] cards added support for displaying message fragments and interactive fragment cards
[05:35:21] we implemented a horizontally resizable panel layout with a dedicated area for future preview features that is exactly
[05:35:29] what was the point and goal of this chapter and may I say we did a pretty
[05:35:34] good job because no comments only some nitpicking comments like we could save
[05:35:41] some time by doing project ID instead of project ID equals project ID so overall
[05:35:48] amazing amazing job in here of course we have an in-depth diagram explaining
[05:35:53] exactly how everything in this page happens including pre-fetching including
[05:35:59] invalidation including refetching everything amazing amazing job i'm going
[05:36:05] to merge this poll request once the poll request is merged I'm going to go back
[05:36:11] inside of my IDE and I will go back to the main branch after that I'm going to synchronize my changes and I will check
[05:36:19] the source control and the graph so I can see that I
[05:36:25] successfully merged chapter 10 that marks the end of this chapter I believe
[05:36:31] amazing amazing job and see you in the next chapter
[05:36:37] in this chapter we're going to continue the UI development from the last chapter
[05:36:42] we pretty much completed the messages container at that point but we do have some things missing like the fragment
[05:36:49] selection and the loading state but after that we're going to focus on the project header component which is the
[05:36:55] component above the messages container which will tell us which is the currently active project and the buttons
[05:37:02] to go back so let's go ahead and first handle the leftovers from the previous
[05:37:08] chapter as always make sure that you're on your main branch and clicked on
[05:37:13] synchronize changes just to confirm everything is up to date so now what I
[05:37:18] want to do is I want to go inside of my project view inside of projects UI views
[05:37:24] project view and in here let's go ahead and let's introduce an active fragment
[05:37:30] and set active fragment state from use state and by default let's set
[05:37:39] it to null and the type can be a type of fragment from Prisma or null so just
[05:37:45] make sure you added this imports here once you've added that let's go ahead
[05:37:52] and let's modify the messages container component to have a few more procs
[05:37:59] let's add active fragment to be active fragment and let's add set active
[05:38:05] fragment to be set active fragment now go inside of the messages container and
[05:38:12] let's improve these props so I'm going to add the active fragment prop to be
[05:38:18] fragment or null and make sure to import the fragment and add the set active
[05:38:24] fragment right here and then you can extract them in the new props here
[05:38:31] active fragment and set active fragment just like that and then inside of use
[05:38:38] effect here if we detect the last assistant message call set active
[05:38:43] fragment and set last system message my apologies
[05:38:50] last assistant message dot fragment inside but only if we have last
[05:38:57] assistant message fragment uh well actually since it's going to be
[05:39:04] null h yeah let's go ahead and we can just do
[05:39:10] this it's okay and call this there we go so now one of the fragments
[05:39:17] will always be selected what we have to do now is we have to go to the message card and set the active fragment
[05:39:24] question mark ID to be identical to message fragment question mark id and
[05:39:31] set active fragment will um on fragment click will call set active fragment and
[05:39:38] pass the message fragment inside like this so now inside of your project here
[05:39:46] when you click on a specific fragment it should be highlighted like this
[05:39:52] perfect and when you load the page since this is an error right now nothing is
[05:39:58] highlighted here but if you try this again build a landing page for example
[05:40:04] i'm going to wait for a second for this to respond and you're going to see that then when you refresh it will
[05:40:09] automatically select that fragment thanks to this use effect right here which
[05:40:16] searches for the last message which role is assistant
[05:40:23] and perhaps we can even improve this by searching for the last assistant message with fragment and then we can do this
[05:40:32] and message.fragment fragment and just turn this into a boolean and then just
[05:40:39] do this so you can see that now when I refresh
[05:40:45] this fragment is automatically selected perfect exactly what we need so now that
[05:40:52] we have that let's also create a loading state in order to do that let's go
[05:40:57] outside of the use effect here let's create a constant to find the last message instead of data let's use
[05:41:05] messages like this and then we are going to find the last user message so if if is last
[05:41:13] message user so if last message role is user it means that we are the one who
[05:41:18] sent the message last so that's going to be the system we are going to rely on for now to display loading later we can
[05:41:26] improve it more so let's do this let's go just above the bottom riff and let's
[05:41:31] do if last message is user add message loading state
[05:41:38] like this now let's create message loading tsx here and in here this is what we're
[05:41:46] going to do so import image from next image and import use state and use
[05:41:55] effect from react now in here first define shimmer messages function
[05:42:04] and in here add an array of messages this can be anything you want so I'm
[05:42:09] going to add thinking loading generating analyzing your request building your website crafting components basically
[05:42:16] things like that and then what I'm going to do is I'm going to create a state for
[05:42:22] current message index and set current message index with the initial value of zero and then I'm going to create a use
[05:42:29] effect here like this
[05:42:34] and the use effect will do the following it will create an interval set interval
[05:42:42] and inside of this interval every two seconds I'm going to call set
[05:42:48] current message index previous
[05:42:53] + one modulus messages.length
[05:42:58] like that and inside of here I'm going to add messages.length
[05:43:04] and in the return method here call clear interval and pass the interval constant
[05:43:11] like this and then inside of here you are going to return a div and a span
[05:43:20] and inside render the currently active message
[05:43:26] like this now give this a span a class name of text base text muted foreground
[05:43:34] and animate false and give the outer div a class name of flex items center and a
[05:43:42] gap of two like this and now finally let's export
[05:43:47] const message loading inside of here we're going to return a
[05:43:53] div with a class name flex flex column group px of two and padding bottom of
[05:44:00] four then a div of class name flex items
[05:44:06] center gap 2 pl2 and margin bottom of two then we're going to render an image
[05:44:14] component with a source of logo SVG out of our project name width of 18 height
[05:44:23] of 18 as well and a class name of shrink zero after that a span with the name of
[05:44:31] our project with a class name text small and font medium outside of this div
[05:44:37] we're going to open a new one with the class name pl 8.5 flex flex column and
[05:44:44] get y of four and inside render the shimmer messages component and then
[05:44:52] inside of the messages container here you can import message loading component
[05:44:58] like this so now if you try and do build a yellow landing page
[05:45:05] you will see this thinking loading generating analyzing your request so
[05:45:13] something for the user to look at while this generates uh and if you really want
[05:45:18] to immediately see the results of this so right now we have to refresh we have to wait for some kind of refetch what
[05:45:25] you can actually do inside of your messages container is you can add
[05:45:32] a refetch interval for example every 5 seconds so now even without you
[05:45:38] refreshing it's going to refetch the messages every 5 seconds and there we go we get a result so we can add a to-do
[05:45:45] here temporary live message update like this but just
[05:45:54] so you can start showing this to people so you don't have to refresh your page every time so yes now if you take a look
[05:46:00] at your network request every 5 seconds there there will be a network for refreshing the messages but don't worry
[05:46:08] uh since we are using React query a lot of this will be cached great so now
[05:46:15] let's go ahead and let's build a component which will be above this and it will be used to display the project
[05:46:22] name and the ability to go back so I'm going to go back inside of the
[05:46:29] project view component and just above the suspense for loading messages I am
[05:46:36] going to add project header component i'm going to pass project ID to be
[05:46:42] project ID like this and after you've done that let's go inside of components and let's create
[05:46:48] project- header.tsx
[05:46:55] like this now inside of here let's go ahead and add the following imports link
[05:47:01] image used theme from next themes so you already have this
[05:47:07] inside of your package JSON this will be used to enable dark mode use suspense query from tanstack react
[05:47:14] query some icons chevron down chevron left edit sun moon icon and then let's
[05:47:23] add use tpc from tRPC client button from components UI button and all of these
[05:47:31] imports from the drop-own menu the menu itself content item portal
[05:47:38] radio group radio item separator sub sub subcontent subt trigger and menu trigger
[05:47:45] all of those things now let's go ahead and let's create an in interface props here and let's go ahead and define
[05:47:52] project header right here now when we are inside of here we can
[05:47:59] add tRPC use TRPC and we can go ahead and fetch our project using use suspense
[05:48:06] query TRPC projects get one query options ID project ID and now we've done
[05:48:13] what we did initially right remember we had the project loading here but now we
[05:48:18] moved it here so it's time to do the following first import the project header from docomponents project header
[05:48:25] and after that wrap it in its own suspense like this
[05:48:32] and give it a fallback of loading project
[05:48:37] like this and now that we have this let's go ahead and add a header tag
[05:48:43] right here let's give it a class name of padding 2 flex justify
[05:48:50] between items center and border bottom
[05:48:55] and let's call it header and let me just refresh here uh and
[05:49:01] looks like it's not showing now uh it is but it is very small I believe so let's
[05:49:07] go ahead uh and let me see let's Oh my apologies no it is not
[05:49:14] visible we are not rendering anything i thought it was just very small but it didn't make sense
[05:49:20] make sure to return it there we go now we can see header in the text there we
[05:49:25] go perfect so now let's go ahead and develop this header even further so I'm
[05:49:31] going to add a drop-own menu here we have all of these components imported
[05:49:36] now inside of here add a drop-own menu trigger and give it an as child property
[05:49:43] this will allow it to become the button which is inside
[05:49:48] and then let's give this button a variant of ghost a size of small a class
[05:49:55] name of focus visible ring zero hover bg
[05:50:02] transparent hover opacity 75 transition
[05:50:07] opacity and pl2 with an exclamation point at the end in Tailwind this means
[05:50:13] important we are basically overriding some classes in here you're going to
[05:50:18] render the image with the source of logo SVG out of the project name width of 18
[05:50:27] height of 18 then a span element with the project
[05:50:33] name the project name coming from the query which we just loaded this will
[05:50:39] have a class name of text small and font medium after that a chevron down icon
[05:50:48] and there we go this now becomes a drop-down menu it doesn't have the uh
[05:50:54] proper cursor but don't worry we will fix that later great so now let's go ahead and go
[05:51:04] outside of the drop-down menu trigger and let's add drop-down menu content and
[05:51:10] let's give this a side of bottom let's give this an align of start
[05:51:17] let's get the drop-down menu item here
[05:51:23] let's give it an as child property let's make sure we close the drop-own
[05:51:28] menu item component add a link component here give it an href to the root page add the chevron
[05:51:38] left icon and a span element go to dashboard
[05:51:44] and there we go now the first item is to go back perfect now we have a way to go
[05:51:51] to the landing page what I want to do next is I want to
[05:51:56] create a drop-own menu separator so let's do drop-own menu separator here
[05:52:03] there we go and below that add a drop-own menu sub and then a drop-own
[05:52:09] menu subt trigger give this a class name of gap 2
[05:52:16] inside of this trigger render a sun moon icon give this a class name of size 4 and
[05:52:23] text muted foreground and then a span with the text appearance
[05:52:33] and now you have a submen here and now let's go ahead and go outside of the
[05:52:38] trigger and add drop-down menu portal
[05:52:44] inside of the portal add drop-own menu subcontent
[05:52:51] inside of subcontent add drop-down menu radio group
[05:52:58] give it a value for now uh of light
[05:53:04] and on value change of an empty arrow function for now
[05:53:10] now let's add drop-down menu radio item give this a value of light
[05:53:18] and render a span light now go ahead and copy this two times the
[05:53:27] second one will be dark with the text dark the third one will be system with
[05:53:33] the text system like this and now you will have the option to
[05:53:41] select different themes in order to enable this we first have to go inside
[05:53:49] of our layout our main layout in the app folder next to the root page right so
[05:53:56] this one with the body and everything and then in here add to the HTML tag
[05:54:02] suppress hydration warning and then inside of body add a theme provider from
[05:54:09] next themes and encapsulate the toaster and the children so just make sure you have
[05:54:17] added the import here let me just move this up here
[05:54:22] oops looks like I did something incorrectly here
[05:54:28] let me just do it again so I'm going to add theme provider
[05:54:33] and encapsulate the children now inside of here I'm going to give it
[05:54:38] an attribute class i'm going to give it a default theme of system and I'm going
[05:54:44] to give it the enable system option as well as disable transition on change
[05:54:52] and now let's go inside of project header back and in here
[05:54:57] I'm going to add const set theme and theme from use theme you have imported
[05:55:06] this from next themes you can remove the edit icon and now let's go back to our
[05:55:13] radio here set the value to be theme change this to be uh set theme and I
[05:55:21] think that is pretty much it if you try clicking on dark mode uh it should use
[05:55:27] the dark mode try refreshing if it doesn't work there we go
[05:55:33] perfect we now have dark mode we will of course improve the look of it later but
[05:55:39] pretty impressive so far great so that marks the end of the project header for
[05:55:45] now what we're going to do or start doing in the next chapter will be
[05:55:51] previewing the actual fragments and fix any potential issues that we have this
[05:55:57] will also include creating the code editor right amazing job so let's go
[05:56:03] ahead i can see that we have some issue here every time I select this fragment very soon the bottom one starts to
[05:56:11] select so I'm pretty sure that something inside of my messages container uh oh
[05:56:17] yes the refetch interval is probably causing this to uh refetch every time so
[05:56:24] maybe a better option for now would be to not use it so I'm going to comment it out i will add to-do this is causing
[05:56:32] problems yes it's definitely that refetch interval so now by default no fragment
[05:56:38] is selected only you can select it it's okay to be like that now uh great in the
[05:56:45] next chapter we are developing this so let's go ahead and do what we usually do
[05:56:50] let's mark what we completed and let's open a new branch project
[05:56:56] header so I'm going to open a new branch here
[05:57:01] create new branch 11 project header i'm going to stage all of my changes 11
[05:57:10] project header i'm going to commit and I'm going to publish this branch
[05:57:16] then I'm going to go ahead and go in my GitHub and I'm going to open a new pull
[05:57:21] request so that we can review all the things we did
[05:57:27] and here we have the summary new features we added a dynamic project
[05:57:32] header with theme switching and navigation options we also introduced a loading indicator with animated messages
[05:57:39] during message processing we enabled live updates for messages with automatic
[05:57:44] refreshing every 5 seconds we improved message interaction by highlighting and managing active message fragments
[05:57:52] perfect that is exactly what we did in this chapter as always in here we have
[05:57:57] file by file walkthrough and of course a sequence diagram this time including the
[05:58:03] periodically refetching messages which we just added amazing and as for the
[05:58:09] comments we are very good again no comments except some nitpick comments
[05:58:15] amazing job let's go ahead and let's merge this and after you have merged it
[05:58:21] go back to your project change to the main branch and make sure to synchronize your changes after you have synchronized
[05:58:27] your changes as always you can click on the source control graph and confirm that you have just merged chapter 11 and
[05:58:36] I believe that marks the end of this chapter amazing amazing job and see you in the next one
[05:58:43] in this chapter we're going to focus on creating the fragment view component and
[05:58:49] this entire chapter is pretty straightforward we just have to create an ability to view that E2B sandbox URL
[05:58:58] so let's go ahead and do that as always ensure that you're on your main branch
[05:59:04] and synchronize changes to make sure everything is up to date the last chapter was chapter 11 so now let's go
[05:59:11] ahead inside of source and basically just find project view there we go
[05:59:18] inside of this project view go inside of your second resizable panel and in here
[05:59:24] render the fragment web component we are only going to render this if we have an
[05:59:30] active fragment so if you have an active fragment only then render the fragment
[05:59:35] web and pass in the data to be active fragment as simple as that and you can
[05:59:42] turn this into a boolean like this perfect now let's go ahead and let's go
[05:59:48] inside of components fragment web.tsx
[05:59:55] now in here let's create an interface props with fragment from generated
[06:00:01] Prisma now let's go ahead and let's add a couple of more things use state from
[06:00:06] react external link icon and refresh CCW icon and then we're going to use the
[06:00:14] button component from components UI button now in here let's go ahead and
[06:00:20] export function fragment web which accepts data and props and in here
[06:00:28] let's go ahead and start by doing a div
[06:00:34] with a class name flex flex column full
[06:00:39] width full height and then inside of here we're going to do an I frame
[06:00:48] and we're going to add key uh actually we can't do this yet my apologies so for now just do a class name height full
[06:00:57] width full sandbox allow forms allow scripts and allow same
[06:01:06] origin and then loading will be lazy and source will be data sandbox URL like
[06:01:15] this and then let's go ahead and
[06:01:20] import this from component fragment web
[06:01:26] and I think that now when you click here you should be seeing a big error saying
[06:01:31] that sandbox was not found but try creating a new prompt so build a landing
[06:01:37] page let's go ahead and do that and let's wait for this to generate
[06:01:44] and once you get a response you can click on the new fragment and in here you are now able to preview inside of
[06:01:50] the iframe the new landing page which was just created amazing amazing job so
[06:01:58] you are pretty much halfway there right great so now let's add some features to
[06:02:03] make this seem like a little browser so inside of this fragment web we're now going to add a couple of things above
[06:02:10] the iframe add a div and give this div a class name padding two border bottom
[06:02:18] background color sidebar flex items center and gap x of two so now just
[06:02:25] above here you have a little bar then in here add a button component and inside a
[06:02:32] refresh CCW icon give this a size of small a side of bottom oh my apologies
[06:02:41] no these are completely wrong props uh variant of outline and on click for now
[06:02:48] just an empty function and now you have a refresh button here perfect
[06:02:55] so after that go ahead and copy this button and in here you're going to have the
[06:03:02] following you're going to have a span inside of here like this
[06:03:11] which will render data sandbox URL it will have a class name of truncate
[06:03:19] and now let's go ahead and do the following collapse all of these props
[06:03:25] like so and keep the variant and keep the size so
[06:03:32] let's just add a class name here to be flex one justify start text start and
[06:03:40] font normal so now you have a big uh kind of like an address bar right
[06:03:47] showing the current fragment URL and then let's go ahead and just add
[06:03:52] disabled prop to be explicitly false and then after this button let's add
[06:03:59] another one which will have the external link icon and give this one a size of
[06:04:06] small a disabled if there is no sandbox URL variant of outline
[06:04:13] and on click will be an arrow function which checks if there is no data sandbox
[06:04:19] URL return otherwise call window open
[06:04:24] data sandbox URL blank as the second argument so it opens
[06:04:29] in a new tab there we go now let's go ahead and go inside of
[06:04:36] frame and let's add uh I keep doing the key but I keep forgetting to implement
[06:04:41] the key let's finally do that so go to the top here and add fragment key and
[06:04:48] set fragment key and call use state
[06:04:53] like this then let's add copied and set copied use state false
[06:05:02] let's add on a refresh method set fragment key
[06:05:09] previous previous + one con handle copy
[06:05:17] navigator clipboard write text data sandbox URL
[06:05:25] set copied goes to true and set timeout is fired with set copied set to false
[06:05:33] with a 2cond timeout out now that we have these two let's go
[06:05:38] ahead and add on refresh here
[06:05:44] like so and for this one let's give it an on
[06:05:49] click to be handle copy and disabled if there is no data sandbox URL or if we
[06:05:56] just copied something and in here I think it is good enough so
[06:06:04] now you should have buttons to open this in an external tab like this you should have buttons to copy this so when I
[06:06:11] paste there we go and you should be able to refresh this but looks like the refresh one uh is not working let me
[06:06:18] just check yes it's okay if this expires that's completely fine it expires very soon
[06:06:25] because we don't want to spend our free credits on E2B so I don't think this
[06:06:30] refresh is working and it's not working because we need to add the fragment E
[06:06:35] here so now when you hit refresh you can see how it it blinks which basically
[06:06:40] means it is refreshing perfect so let's try build a calculator app
[06:06:47] and let's see that and let's see how that displays in something like this
[06:06:53] and here we have a calculator app pretty pretty cool amazing we can now
[06:07:00] refresh this and there we go you have a whole new refreshed page uh perfect you
[06:07:05] can copy this amazing so now what I want to do is I want to develop one simple
[06:07:11] component called hint and we're going to store that inside of source components
[06:07:18] hint.tsx so not inside of the UI folder let me
[06:07:23] just close it here i mean it doesn't matter if you want to you can put it inside of the UI folder and in here
[06:07:30] we're going to mark this as use client and we're going to import everything tool tip related from components UI tool
[06:07:37] pip you already have this in it is inside of the UI folder so import all of these things and then
[06:07:44] create the following interface hint props accepting the children the text
[06:07:49] and then optional side and align which accepts top right bottom or left and align start center and end
[06:07:57] and then let's go ahead and export const hint with some predefined props here
[06:08:05] so basically we have the children the text the side which by default will be top and align which by default will be
[06:08:12] center and then inside of here what you're going to do is you're going to add the tool tip provider you're going
[06:08:18] to add the tool tip itself and then you're going to add a tool tip trigger
[06:08:23] like that as child property and the render children inside and then you're
[06:08:30] going to add tool tip content you're going to pass in the side prop you're going to pass in the align prop
[06:08:38] and inside you're going to render a paragraph with a text
[06:08:44] just like that that is our hint component now let's go back inside of the fragment web and let's wrap it
[06:08:50] around a couple of items starting with the external link icon so simply wrap
[06:08:55] your button in your new hint component like this and then you can add a text here and say
[06:09:03] open in a new tab and a side of bottom and then a line of start just make sure
[06:09:10] you have imported the hint from components hint and now when you hover
[06:09:15] it say it tells you what it does right because just by looking at the icons it might not be clear and now let's do that
[06:09:23] for the rest so find the copy button and wrap it in a
[06:09:30] hint like this click the copy with a side of bottom
[06:09:36] so now when you hover over here you can see that you can click to copy and then
[06:09:42] do the same thing for this one
[06:09:49] to refresh there we go so now we can refresh as well amazing
[06:09:55] amazing job in the next chapter what we are going to do is we're going to implement tabs here so we can switch
[06:10:02] between a code preview and a actual web preview like we are doing now great so
[06:10:11] let's go ahead and mark this as completed a very simple chapter but a very powerful and very rewarding chapter
[06:10:17] may I say so let's go ahead and open a pull request so this is chapter 12
[06:10:23] i'm going to close everything new branch 12 fragment preview is that the name it
[06:10:31] is fragment view let's add and stage all of my changes
[06:10:39] let me just click here there we go stage the changes 12 fragment view let's
[06:10:45] commit and let's publish the branch and let's go ahead and open a pull
[06:10:51] request here and let's review what we just did
[06:10:59] and here we have this summary we introduced a reusable tool tip component for displaying contextual contextual
[06:11:06] hints we added a web fragment preview component with controls to refresh copy
[06:11:12] and open the preview in a new tab we enabled a live preview of the project fragments directly within the project
[06:11:18] view including interactive controls and tool tips perfect as always an an
[06:11:25] in-depth walkthrough as well as a sequence diagram here and some actionable comments so yes
[06:11:32] navigator.Clipboard.ext is technically a promise so it can you
[06:11:39] can do on it and catch on it so it is possible that the copy feature fails so
[06:11:46] it might be a good idea to add then and catch to uh at least display some kind
[06:11:52] of error at least internally for you so you know something is going on this is not a bad idea and in here it allows
[06:11:59] improving uh it suggests improving accessibility for the iframe by adding the title and area labels great i'm
[06:12:07] satisfied with what we have so I'm just going to merge this pull request and once it is merged I'm going to go
[06:12:14] back here main branch and refetch and after it refetches
[06:12:21] there we go fragment view is the last merged one amazing that marks the end of
[06:12:27] this chapter so let's go ahead and mark this as complete and see you in the next one amazing amazing job
[06:12:36] in this chapter we're going to implement the code view this will be a slightly longer chapter in comparison to our last
[06:12:43] one simply because we have a bit more components to create but let's start
[06:12:49] with adding tabs in our project view component so that we can switch between the fragment web component and code view
[06:12:57] component so as always ensure that you are on your main branch and you can synchronize
[06:13:03] changes the last chapter was 12 fragment view
[06:13:09] now let's go ahead inside of our project view and this time we're going to add a
[06:13:15] couple of components so let's go ahead and just in between the fragment and the
[06:13:20] components UI resizable add tabs tabs content tabs list and tabs trigger from
[06:13:26] components UI tabs you have them installed when you added chats UI and
[06:13:32] once you have added them it's time to use them so what I'm going to do is I'm
[06:13:37] going to go below the project view and I will add tab state and set tab state I
[06:13:45] will add use state here and I will set the options to be preview or code and by
[06:13:52] default it's going to be preview now Now that we have the tab state let's go in
[06:13:58] the second resizable panel here and let's encapsulate the active fragment
[06:14:05] within tabs now in here let's give the tabs a class
[06:14:10] name height full gap Y zero default
[06:14:16] value will be preview value will be tab state
[06:14:22] and on value change we'll get the new value and set tab state to be value as
[06:14:30] preview or code like this
[06:14:36] then inside of this tabs let's add a new div and let's encapsulate this once again
[06:14:43] this div will have a class name of full width items center padding two border
[06:14:50] bottom and gap x of two and then open tabs list and again encapsulate the
[06:14:58] fragment inside of the tabs list give it a class name of height zero padding zero
[06:15:06] border and rounded medium and then finally inside of here we can add tabs
[06:15:12] trigger the first one will be the value preview with the class name rounded medium
[06:15:22] we're going to render the I icon here which you can import from Lucid React
[06:15:27] and while you're here also import icon let me just move them to the top there
[06:15:34] we go so let me just fix this uh just a second
[06:15:44] so I think I just have to remove this there we go so inside of this tabs trigger add the
[06:15:51] eye icon like that and a span demo
[06:15:57] and then copy this trigger this one will be code with the text code and uses the
[06:16:05] code icon and then outside of the tabs list
[06:16:10] go ahead and add a div with class name
[06:16:15] ML auto flex items center and gap x of
[06:16:22] two and this button will
[06:16:28] uh I'm sorry this div will encapsulate a button from components UI button
[06:16:35] which will uh not serve any purpose now but it will later so give it as child
[06:16:42] give it size small variant and for now give it well just default
[06:16:52] a link from next link so make sure to add this
[06:17:00] with an href of pricing and add a crown icon
[06:17:08] and upgrade text great and now
[06:17:16] outside of that div and outside of this div as well so move this outside add
[06:17:23] tabs content this one will be for value preview so
[06:17:30] you can put this finally inside and then we're going to have another tabs content
[06:17:36] or value code and this will simply be a paragraph to-do code
[06:17:43] there we go so make sure tabs content is still inside of tabs so now when you go inside of your app here you should see a
[06:17:51] button to upgrade which should lead you to 404 page and you should see that you
[06:17:57] can switch between demo and between code uh the demo doesn't show anything until
[06:18:02] you select a fragment right so you can see how you can switch between the two
[06:18:08] so now let's develop the code part so in here it will be quite similar
[06:18:16] so let's start by doing the following mpm install prismjs
[06:18:22] this will be used to uh highlight code syntax so let's go ahead and develop
[06:18:28] this simple component inside of source components so in here
[06:18:33] add code view.tsx and in here you're going to need uh just
[06:18:40] one more thing so let's actually create a folder code view like this and move
[06:18:47] this inside and you can change this to be index.tsx
[06:18:56] and then go inside of your uh vibe assets you can use the link in the description or you can see it on the
[06:19:02] screen here and find code theme.css so it's quite long that's why we are not
[06:19:07] typing it so go ahead and copy this and create it here so code theme.css
[06:19:15] and just paste the entire thing inside and save it and now let's go ahead and develop the code view here so you're
[06:19:23] going to import everything from PrismJS and let me show you Prism.js oh did I
[06:19:28] install it or not mpm install PrismJS
[06:19:35] let me see prismjs it is installed but I think I also need to do mpm install-d at types
[06:19:43] prismjs there we go so prismjs 1.3 and types
[06:19:49] 1.26.5 and now it works below that import use effect and then
[06:19:57] import the following things risenjs components and then JavaScript JSX
[06:20:03] Python TSX or TypeScript you can remove if you're not going to use Python for example
[06:20:10] and finally import code theme CSS so
[06:20:15] just make sure this is in the same folder right then export const code view
[06:20:23] and create a simple interface props
[06:20:29] which accepts the code which is a string and a language which is a string
[06:20:36] so assign the props let's dstructure them code and language and inside of here return a
[06:20:45] pre-tag give it a class name padding two background color transparent border none
[06:20:53] rounded none margin zero and the text extra small
[06:21:00] and inside of here add a code element which renders the code
[06:21:07] and let's give this a class name and let's go ahead and use language
[06:21:14] dash lang like this usually if this was a TypeScript uh class name you would not
[06:21:21] do this because this type you shouldn't do this kind of half dynamic class name
[06:21:27] right you should instead do the full one but this is not a Tailwind class
[06:21:33] this is a class from Prism right that's why you don't have to worry because you
[06:21:39] can see that it is exactly what it expects and now let's just use the use effect
[06:21:45] here for a very simple thing so on load simply use prism and highlight all
[06:21:53] that's it so that's going to be our code view component
[06:21:58] and if you go inside of project view uh maybe we can already render it let's try code view
[06:22:04] and let me try adding language to be JS or let's do ts and let's do code
[06:22:11] let me just try const a is equal hello world
[06:22:18] something like that let's see if we are able to preview that and we are there we go and I think that it will also affect
[06:22:25] dark mode and you can see how the syntax is visible very nice
[06:22:31] and now let's actually uh use this in a file explorer because that's what we
[06:22:38] have to do next so we're going to go ahead and create the file explorer
[06:22:44] inside yes let me just show you how you can import code view so you don't have to go to index
[06:22:51] index can be uh used like this that's why we named it index so you can just
[06:22:56] target code view in case this doesn't work for you for any reason you can just name this
[06:23:02] properly name it code view again and then just import that way and let me just move it up here there we go
[06:23:11] so now let's create the file explorer component i'm going to go inside of source
[06:23:16] components file whoops
[06:23:22] file explorer.tsx and let's go ahead and let's prepare the
[06:23:29] imports copy check icon and copy icon from lucid react use state use memo and
[06:23:36] use callback as well as fragment from react
[06:23:41] hint and button from components button comes from shatzen meaning it has the UI
[06:23:48] prefix and hint is our custom component which we created in the previous chapter
[06:23:53] now let's import our new code view which we just created
[06:23:58] and then let's go ahead uh and add resizable
[06:24:05] with resizable handle panel and panel group and let's also import everything
[06:24:11] we need from breadcrumb so both of this come from shatnui so you have them
[06:24:18] breadcrumb item list page separator and ellipses
[06:24:23] now let's go ahead and let's define our file collection
[06:24:28] this is our file collection type it is basically a type of record string string
[06:24:34] but I like to use this type simply because it uses the path as the key and then the content here i think this kind
[06:24:40] of visually makes more sense i think we did the same thing in our functions
[06:24:47] path string yes this is exactly how we defined our files here so I like to do this because I think uh it visually
[06:24:54] looks better great so now let's go ahead and first create a function which can
[06:25:00] extract language from file extension so get language from extension accepts the
[06:25:05] file name and returns a string and what we do here is we simply target the
[06:25:11] extension part and we take that part and we turn it to lowercase and we default
[06:25:16] to text if we were unable to do that so basically if we enter something like
[06:25:22] app.tsx we return tsx as the language as simple as that
[06:25:30] perfect now let's go ahead and let's create
[06:25:35] uh a component which we are going to need in order to even render uh which file is currently active so I'm just
[06:25:41] trying to think what is the best way to build this so that you can see the results as soon as possible because
[06:25:47] there's a lot of components we have to build and I'm just afraid that um we might have to build for a lot of time
[06:25:53] without seeing any results so this is what I will do we're going to do export
[06:25:59] const file explorer like this
[06:26:04] let's create an interface file explorer actually let's just call this yeah file explorer props because we're going to
[06:26:11] have many components in this file so I want to name this explicitly to be file explorer props it will accept files
[06:26:18] which are a type of file collection like this then let's go ahead and let's use this
[06:26:25] and we can destructure the files from here so now what I want to do is I want
[06:26:31] to add the return resizable group resizable panel group like this with the
[06:26:38] direction horizontal and then resizable panel
[06:26:47] with a default size of 30 with a minimum size of 30 and a class
[06:26:54] name background sidebar and inside of here a paragraph to-do
[06:27:02] tree view like this then let's go ahead and let's add a
[06:27:08] resizable handle here with a class name hover background
[06:27:15] primary and transition colors like this
[06:27:21] and then let's go ahead and do another resizable banner
[06:27:27] like this with a default size of 70 and a minimum size of 50
[06:27:34] and in here what we are going to do is try and do files
[06:27:42] first in the array i'm just thinking of a way okay I know
[06:27:48] what we can do now let's create a state called selected files
[06:27:55] so const selected file set selected file
[06:28:00] use state and it can either be a string or null
[06:28:06] and let's go ahead and create a function inside of use state to get the file keys
[06:28:13] by using object keys and pass in the files and then return file keys.length
[06:28:18] length is larger than zero we can select from the file keys the first in the
[06:28:25] array otherwise null so this way we are going to pre-seelelect the first file we
[06:28:30] can find and now that we have this first file I think it will be a little bit easier for us to build this UI so inside
[06:28:38] of this second resizable panel check if we have the selected file and if inside
[06:28:43] of files we can find this selected file if we can do that go ahead and render a
[06:28:49] div code view like this otherwise let's go ahead and
[06:28:56] render the alternative which is a div which says select a file to view its
[06:29:03] content with a class name flex height full items
[06:29:11] center justify center and text muted foreground
[06:29:16] and I think it's time to render this so let's go inside of the project view here and let's go ahead and render it instead
[06:29:24] so remove code view and check if you have active fragment question mark files
[06:29:31] render the file explorer component and pass in the files to be active
[06:29:37] fragment.files files as and in here you can choose to use
[06:29:45] let me just copy from here this type basically
[06:29:52] because the JSON type will be any right so we are now marking it as this make
[06:29:58] sure to import the file explorer and you can remove the code view now because we're going to use it inside of the file
[06:30:04] explorer and I think that already just make sure you have a fragment selected here When you click on code you should
[06:30:10] have a to-do tree view and to-do code view perfect
[06:30:15] and I've had some trouble uh making this work oh looks like it's working just
[06:30:22] fine okay my version had some problems i think looks like it works just fine
[06:30:28] nevertheless okay now let's go ahead and let's actually develop the tree view and the code view so I'm going to go back
[06:30:34] inside of the file explorer here and I think it might be easier to develop the code view first simply because we
[06:30:40] already have the code view so I'm going to go inside of this div here and I'm going to add a class name height full
[06:30:48] width full flex and flex column and then I'm going to open a new div the class
[06:30:55] name border bottom bg sidebar px4 py2
[06:31:01] flex justify center uh actually it will be justify between
[06:31:07] items will be center and gap x will be two
[06:31:12] then let's add to-do breadcrump file breadcrump
[06:31:17] like this and then add a hint component wrapping our button component and give
[06:31:24] this a text of copy to clipboard and the side of bottom
[06:31:30] and for this button right here give it a variant of outline a size of icon a
[06:31:38] class name of ML auto on click to be an empty arrow function
[06:31:45] and disabled to be false and inside of here render
[06:31:50] the copy icon so now when you click on code you should
[06:31:56] have the copy to clipboard button just make sure you have both button and the hint imported
[06:32:04] great and now below this div we're going to open a new div with a class name flex
[06:32:12] one overflow auto and render the code view
[06:32:18] in here select the code to be files and then selected file and the language will
[06:32:25] be oops the language will use our function get
[06:32:31] language from extension selected file whoops
[06:32:38] like this and by default you can see that it selected a specific file right
[06:32:44] now I'm not able to scroll we will fix this as well by uh let's see it has
[06:32:50] overflow auto but I think that we are missing uh something obviously because
[06:32:56] it's preventing us from doing this uh so let's see
[06:33:03] everything here seems fine but yes I'm not able to scroll to the
[06:33:09] bottom here so how about I go inside of the project view here
[06:33:14] and to the value code add a class name a minimum height of zero
[06:33:21] and I think that now when you select the fragment there we go now I'm able to scroll in all directions you should be
[06:33:29] able to scroll left and right and up and down so basically inside of your project
[06:33:34] view in the tab content for the value code add a minimum height of zero and
[06:33:40] this will allow you to scroll inside of the code preview so this is now showcasing the very first file it
[06:33:46] selected but now we have to build the tree view so we actually see the file we selected and so that we can choose
[06:33:53] between other files and then we need a breadcrumb component here to render the
[06:33:58] current file so let's go ahead and let's build the tree view next so I'm going to
[06:34:05] prepare that right here in the file explorer right above where we added a to-do to render the tree view let's add
[06:34:13] tree view like this and let's give it some props data is going to be an empty
[06:34:21] array value will be selected file on select will be an empty function and now
[06:34:28] let's go ahead and let's prepare this things here so what I want to do now is
[06:34:33] the following uh I want to go inside of source lib utils and I will export
[06:34:41] function convert files to tree items and I'm going to create a JS doc like
[06:34:50] this simply so you can see what happens so this JS doc is quite useful i don't
[06:34:55] like I mean I don't use it usually but it's useful when I feel like things are not exactly clear you can see how when
[06:35:02] you create a comment like this and when you hover over a function it actually tells you that so it converts a record
[06:35:08] of files to a tree structure so we accept files which is a record of file paths to content so this is the input
[06:35:15] right source button tsx and then some content and this is the output that it
[06:35:21] will return so that's what we are building now so let's go ahead and add
[06:35:26] some props here files which will be a type of path which is a type of string
[06:35:32] and a string and it will return a tree item so now we
[06:35:38] need to create the tree item object so let me just
[06:35:44] uh do this like so I'm trying to think of a perfect place
[06:35:49] to add this to um how about in source we just create
[06:35:55] types ds and let's export type tree item
[06:36:01] and that will be a string or an array of string
[06:36:07] and tree item itself so it can reference itself right it can be a deeply nested
[06:36:15] array now that we have this we can go back inside of the utils file here uh and we
[06:36:23] can set the return method to be the return type to be tree item from the types and it's going to be an array of
[06:36:29] those three items and it's going to be an error until we actually return that so I want to do this because this way we
[06:36:36] are certain that we correctly developed this so let's start by creating an
[06:36:42] interface tree node like this which is basically a key which is a string and
[06:36:48] then tree node which is itself inside or null then let's define a tree which is a
[06:36:55] type of tree node and it's going to be an empty object at first now let's go
[06:37:00] ahead and create sorted paths so we are basically sorting the files alphabetically
[06:37:07] by their path and then what we're going to do is a for loop so for const file
[06:37:13] path of sorted paths let's go ahead and this uh split the
[06:37:21] file path into parts by doing file path.split by a forward slash the current one will
[06:37:29] be the current tree which is just the empty object for now and then for
[06:37:36] let index being zero index being less than the parts length
[06:37:43] minus one and index increasing by one for each iteration
[06:37:48] get the part so parts and using this index here if we cannot find the path
[06:37:57] the part in the current object we need to add it there like this
[06:38:05] and then current is equal to current part like this
[06:38:11] and then what we have to do outside of here is add the file or the leaf node
[06:38:19] right so const file name is parts parts.length minus one current file name
[06:38:28] is equal to null this will basically indicate that it's a file this is quite confusing right but
[06:38:36] once you see how the file uh structure will look it will make a little bit uh
[06:38:42] more sense uh okay so I think that
[06:38:48] this uh let me just see yeah so okay we just finished this for
[06:38:55] loop right and now we have to uh convert
[06:39:01] the node so let's create an inner function to do that function convert
[06:39:06] node the node it accepts is a tree node we have defined a tree node right here
[06:39:16] and the name is an optional string and it returns back a tree item an array of
[06:39:23] tree items or a single tree item like this so let's get the entries to be
[06:39:31] object entries from a specific node if
[06:39:36] entries.length is equal to zero return the name or an
[06:39:42] empty string then define the children to be a tree item
[06:39:47] like so and set it to be an empty array for now
[06:39:54] and then let's go ahead and do for const
[06:40:00] they structure the key and the value of entries and do the following if value
[06:40:08] is equal to null that means this is a file so do
[06:40:15] children.push key else this is a folder so create a sub
[06:40:24] tree using convert node and pass in the value and the key so we need to go
[06:40:29] deeper we need to recursively call this function again until we find a file if
[06:40:34] array is array subtree
[06:40:40] children dopush open an array of key and spread the
[06:40:45] subree else children do push key and subtree
[06:40:54] like so and then let's go ahead outside of this four and return the children
[06:41:03] like so and then let's define the result here to be convert node tree and return
[06:41:11] array is array result otherwise
[06:41:18] result inside of the array like this and if you've done it correctly you should have no errors here
[06:41:26] now I completely understand that this was a very complex task and if if you
[06:41:32] are worried that you did it incorrectly don't worry uh I have added my entire utilus files to my public assets so you
[06:41:39] can just find it here and you can copy it from here for example I can copy this entire file and I can paste it in here
[06:41:47] like so so now I have this convert node and I have the convert files to three items
[06:41:54] right so if you want to do a double check or you just want to copy file uh
[06:41:59] because it's easier you can do that don't worry uh yes a slight mistake here
[06:42:05] my apologies uh so don't worry I will fix I will fix this file so it doesn't
[06:42:11] use this import because our tree item comes from types
[06:42:16] yes so import type three item uh I will fix that instead i think I can fix it
[06:42:22] right now there we go like so
[06:42:28] so when you copy you won't have that problem uh and I will double check by copying this file again pasting it uh
[06:42:37] oops copy it again i cannot seem to copy it let me try one
[06:42:44] more time i think the copy button is still using the old one
[06:42:49] okay finally no errors in the utilus file okay so now that you have the
[06:42:55] convert files to tree items we can go back inside of the file explorer
[06:43:05] and in here uh we're going to have to create tree data so const tree data will
[06:43:12] be use memo and return convert files to tree items
[06:43:18] and pass files here and in here add files as a dependency so just make sure
[06:43:24] you imported our newly created function here uh you can either write write that
[06:43:30] function yourself as we just did or you can copy it from the source code or from the assets folder uh great now that we
[06:43:37] have this and we have the tree data let's go ahead and let's add the const
[06:43:43] handle file select to be use call back
[06:43:50] and inside of the use call back we're going to
[06:43:55] check the file path to be a type of string and if files file path exists set
[06:44:05] selected file to be the file path and add files here there we go perfect
[06:44:14] and now inside of the tree view add the tree data here
[06:44:21] and on select add handle file select like so and now it's time to develop the
[06:44:28] treeview component so I'm going to go inside of components tree view.tsx
[06:44:36] let's go ahead and create the interface tree view props which uses the tree item from our types
[06:44:43] like so and now let's export const tree view
[06:44:50] let's assign the props tree view props in here we get data value end on select
[06:44:59] and in here let's go ahead and let's return a paragraph tree actually maybe
[06:45:05] we can do JSON stringify data just so we can see
[06:45:10] what we created and let's import the tree view from dot slash treeview
[06:45:20] and if you go back to your app here select a fragment and click code there we go i have app folder and page.tsx
[06:45:27] so those are for me but if I go into one of my older ones well looks like all of
[06:45:32] these are pretty simple so it's going to keep using just uh a simple example but
[06:45:38] if you tell it to build something complicated uh you will have more items
[06:45:43] here so this represents a folder and this represents a file and now I mean
[06:45:48] this is basically how the file structure should look like and now we're going to use that to properly render the tree
[06:45:54] view so uh let's go ahead and let's import everything we need from the sidebar
[06:46:01] component so that's going to be the sidebar the content group group content menu menu
[06:46:10] button menu item menu sub provider and rail from components UI sidebar you
[06:46:16] already have this when you added Shatsen UI and now let's go ahead here and let's
[06:46:22] render that so starting with the sidebar provider and let's render sidebar with
[06:46:30] collapsible to be none and class name to be width full and then sidebar content
[06:46:39] like so inside of the sidebar content sidebar
[06:46:45] group sidebar group content sidebar menu
[06:46:54] like that so you shouldn't see anything now simply because we didn't add anything in the
[06:47:01] menu so now what we have to do is we have to develop the tree component so let's do that below here const tree
[06:47:11] will have an interface tree props which will accept item which is a type of tree
[06:47:16] item it will accept selected value which will be an optional string or it will be
[06:47:23] null on select which will be an optional function which accepts the value
[06:47:28] which is a type of string and returns a void and parent path which will be a
[06:47:34] string so let's go ahead and add tree props here and the structure the item selected
[06:47:42] value on select and parent path like so
[06:47:49] inside of here let's first do a destruction of the name and the rest of
[06:47:54] the items from an array array is array item if it is we can render the item
[06:48:02] otherwise put the item in the array then let's get the current path this will
[06:48:08] check if we have the parent path and it's going to render dynamically using
[06:48:14] backd parent path forward slashname otherwise just the
[06:48:19] name of the file if we don't have any items
[06:48:26] uh this means that this is a file so let's add it's a file const is selected
[06:48:33] here will be selected value equals current path
[06:48:40] and in here we're going to return sidebar menu button
[06:48:46] with is active to be is selected and class name will be data active true
[06:48:54] background transparent and I'll click Here we'll call on select with a
[06:49:00] question mark because it can be optional and pass the current path inside of here render the file icon
[06:49:09] uh file icon from lucid react just make
[06:49:14] sure you have it like that and below that a span and the name and this will
[06:49:20] have a class name of truncate like that and then go outside of this if
[06:49:26] clause and this means it's a folder
[06:49:32] and in here return sidebar menu item
[06:49:37] with collapsible uh we now have to import the things from collapsible as well my apologies I
[06:49:44] forgot about that so just add collapsible content and trigger from components UI collapsible you also have
[06:49:51] those components so let's go ahead uh down here and
[06:49:59] instead of the sidebar menu item open collapsible like that
[06:50:06] uh let me just fix this collapsible give it a class name of
[06:50:12] group forward slash collapsible
[06:50:18] and then add the following class name which is a little bit longer and looks
[06:50:23] weird so basically open curly brackets and this entire thing is inside of that
[06:50:30] curly brackets and and then if data state is open for this component target
[06:50:37] the button target the SVG and target the first child and rotate it by 90
[06:50:44] and set the default to open inside of here collapsible trigger with
[06:50:51] the prop as child Add a sidebar menu button component with
[06:50:58] the chevron right icon from lucid react and give it a class name of transition
[06:51:04] transform so this is the icon that we are going to rotate by 90 once we open
[06:51:09] this collapsible and next to it add a folder icon from
[06:51:15] Lucid React and then a span with the name of the folder and the class name
[06:51:21] truncate and then outside of the collapsible trigger use a collapsible content and
[06:51:30] inside of this a sidebar menu sub
[06:51:35] and inside of here go over items.mmap get the sub item
[06:51:44] and the index and render the tree again that's right we are rendering itself
[06:51:51] again and in here set the key to be index item
[06:51:58] to be sub item selected value to be selected value
[06:52:04] on select to be on select oops parent path to be current path
[06:52:14] like that and that's it for the tree component what we have to do now is we
[06:52:19] have to actually use the tree component and we're going to do that by going back here inside of the sidebar menu and
[06:52:26] simply do data.m map item and index render the tree component
[06:52:33] pass in the key to be index item will be item selected value will be the value on
[06:52:41] select will be on select and parent path will be an empty string so let's see
[06:52:47] what we didn't use we didn't use sidebar rail so we forgot that so let's go down
[06:52:54] here after sidebar content and render sidebar rail
[06:53:02] now let's go inside of the file explorer oh we already have tree view so there we go here we have it and we can open and
[06:53:09] close it uh but looks like our select isn't really showing it isn't working so
[06:53:15] let's fix that or maybe this is the selected state i'm
[06:53:23] not exactly sure so I'm going to try and develop something a bit more complicated
[06:53:29] so I'm going to try to prompt it to something to create more files
[06:53:35] okay so what I did is I asked it to build a landing page with each part in its own component and that generated a
[06:53:43] much better result as you can see so what I'm going to do is I'm going to expand this i'm going to go back to the
[06:53:48] code and yeah I still am not able to select this so let's go ahead and look
[06:53:53] at what we forgot to do so okay these breadcrumbs are unused that's okay uh
[06:53:59] we're going to use them in a moment but it seems like this handle file select uh
[06:54:06] is not working properly so what I'm going to do is I'm going to first start
[06:54:12] by adding a console log and rendering the file path
[06:54:20] so I'm going to open my inspect element here and okay oh so it
[06:54:26] looks app name is being sent okay so that definitely doesn't exist let's go
[06:54:32] inside of a tree view and let's see what I did wrong so in here we have on select
[06:54:40] parent path and then the name yes this this doesn't
[06:54:46] look correct i think I meant this in the current path
[06:54:53] let me refresh and check select the fragment check
[06:54:59] there we go so I'm I'm not sure if you can see well you can definitely see the code is changing right and also the file
[06:55:06] is is a little bit bold so basically the problem was in the tree view component
[06:55:12] the current path I hardcoded name when what I should have been doing uh is put
[06:55:18] it inside of curly brackets like this excellent so now that we have this uh
[06:55:25] the good thing is no more no need for to do anything more in the tree view uh now
[06:55:31] let's go ahead and let's enable the copy button and let's create the file breadcrumb here so I want to do the file
[06:55:37] uh breadcrumb thing first so I'm going to go inside of the file explorer um
[06:55:46] let's go just above it here so const file breadcrumb
[06:55:51] like this let's go ahead and create an interface file breadcrumb props which accepts an
[06:55:59] individual file path let's extract the file path from here
[06:56:06] and let's go ahead and get the path segments by a forward slash and let's
[06:56:13] limit the maximum number of segments to be four so if the path goes deeper than
[06:56:19] four segments we're going to be responsive about it now let's do con render breadcrumb items
[06:56:28] like this and in here if path segments
[06:56:34] length is lower than or equal than maximum segments add a comment show all
[06:56:41] segments if four or less
[06:56:48] so let's return path segments here map segment
[06:56:53] index const is last will be if the index is equal to path
[06:57:00] segments.length minus one and in here return a fragment
[06:57:07] give it a closing tag give the fragment a key of index the
[06:57:13] fragment is imported from React right here inside of the fragment add a
[06:57:19] breadcrumb item check oh let me just fix bread
[06:57:26] breadcrumb inside check is last if it is render
[06:57:33] breadcrumb page and inside the segment
[06:57:39] and give it a class name of font medium if it is not last
[06:57:46] we're going to render a span element and segment inside and give the span a class
[06:57:52] name text muted foreground and then outside of the breadcrumb item
[06:57:59] if it is not last again add a breadcrumb separator
[06:58:05] like so and this was inside of this if so let's now add else
[06:58:12] we are going to show the first element and then ellipses if we have more than
[06:58:18] four of them so the first segment is what we care about path segments first in the array
[06:58:27] last segment so path segments.length
[06:58:33] minus one so it's only those two that we care about and once we get those two let's simply
[06:58:40] return a fragment breadcrumb item
[06:58:46] a span first segment with a class name text muted foreground and then let's go
[06:58:55] ahead and add the breadcrumb separator and the breadcrumb ellipses like so so
[06:59:03] render the breadcrumb separator and then a breadcrumb item which renders the breadcrumb ellipses all of these are
[06:59:10] imported from the same thing then let's add another breadcrumb item here with a
[06:59:16] breadcrumb page and render the last segment inside
[06:59:22] and give this a class name of font medium and finally
[06:59:29] outside of this function return breadcrumb
[06:59:36] and then breadcrumb list and then render breadcrumb items
[06:59:45] like that so a little bit of effort here to create
[06:59:50] nice and responsive file breadcrumbs and now let's go ahead and let's render them
[06:59:56] so that's going to be rendered in the code view so there we go to-do file breadcrumb
[07:00:02] just above this hint let's render a file breadcrumb and let's give it a file path to be
[07:00:09] selected file and there we go app contact tsx features
[07:00:15] footer hero navbar and if you create one that's very deep it will show a maximum
[07:00:22] of four folders before it uses the responsive mode and it will just replace
[07:00:28] the folders in between with an ellipses which is basically three dots perfect
[07:00:34] now let's implement the copy feature so we already did this before so we can
[07:00:42] copy it from that place handle copy use call back if we have the selected file
[07:00:47] right to the navigator clipboard with files selected file and now we have to
[07:00:52] add the set copied state so let me just add it here above the
[07:00:59] selected file copied and set copied perfect so now we have handle copy and
[07:01:04] now let's use the handle copy for this button right here handle copy and let's
[07:01:12] paste in copied copied if it's copied we will use the copy
[07:01:19] check icon otherwise the copy icon
[07:01:26] like this and you should no longer have any errors in your code because we are using everything so when I click copy it
[07:01:31] turns into a different icon now and you can see that I just copied that entire thing amazing we just developed a super
[07:01:40] amazing file explorer so now I'm going to try to prompt it to create a deeper
[07:01:46] structure but this is pretty much it for uh this chapter
[07:01:53] all right so this time I told it build a landing page with each part in its own component use deeply nested folders and
[07:02:00] you can see that I definitely got that so inside of the app folder I have a
[07:02:06] landing and then I have features and then I have the file and you can see our breadcrumb in action now but for example
[07:02:12] you can see that I can break it right i if I open this too much it breaks so what you can do is you can remove the
[07:02:18] maximum segments here to be three and it will be reasonable to change the comment
[07:02:24] here as well and this is how it will look like then let me just refresh i
[07:02:29] think the error was because of the hot reload and let's click on the fragment here so let me select features
[07:02:36] uh okay so you can see it works but it seems like we have some problem here
[07:02:41] uh okay list cannot be a descendant of list uh
[07:02:47] okay it's a hydration error it's not exactly too big of a problem but I'm not
[07:02:54] um I'm not too sure how to fix that at the top of my mind right now so I'm going to leave it like this i think it's
[07:03:01] not too big of an issue it's a small hydration error but you can see how it looks right and if you click on
[07:03:06] something simpler like page you can see that it will display the entire thing but for something complicated it will
[07:03:13] just show you the first and the last segment so you can decide if you want to show that for three segments or for four
[07:03:21] segments right whatever makes sense for you amazing amazing job so I think this
[07:03:27] was uh a much harder chapter but I think it was worthwhile we have an actual uh
[07:03:33] file explorer now that we can copy files from and explore everything that was created we can scroll definitely an
[07:03:41] impressive result so now let's go ahead and mark these things as completed
[07:03:48] and let's open a new branch so 13 code view let me collapse this open the
[07:03:54] source control opening a new branch here 13 code view just to double check that's
[07:04:02] the chapter's name once we are on the new chapter I'm going to stage all of my changes 13 code view i'm going to commit
[07:04:10] and I'm going to publish this branch as always a reminder there's a free code
[07:04:16] rabbit extension you can use to review your files and now let's go ahead and let's see
[07:04:24] our pull request so I'm going to open this new pull request here and let's
[07:04:29] review our summary and here we have the code rabbit summary
[07:04:35] we introduced a code viewer with syntax highlighting and GitHub dark theme we added a file explorer with three view
[07:04:44] breadcrumb navigation and a copy to clipboard functionality for code files we enhanced the project view with tabbed
[07:04:50] navigation allowing users to switch between a live demo and the code view of project fragments that is exactly what
[07:04:58] we did in this chapter as always a walkthrough of file by file and of
[07:05:03] course a sequence diagram so in here we have this very complicated component which we build the file explorer which
[07:05:10] renders the tree view and then finally the code view so in here you can see it generated the entire sequence diagram
[07:05:17] for that component along with the prisjs code highlighting so very very good we
[07:05:24] have a few comments here um this one is a good comment it's basically telling us
[07:05:30] to also add an actual type of check the reason it's telling us this because uh
[07:05:37] it could be anything but then at the same time we know that it's always going
[07:05:42] to be an object it's going to be a type of JSON right so I think this is a
[07:05:47] little bit redundant adding it would not hurt but I think
[07:05:52] it's okay the way it is right now i'm not sure about this change i think uh it
[07:05:58] works just fine like this and in here I accidentally added two semicolons in the
[07:06:04] file explorer props so yes of course we can remove that i'm going to do that in the next chapter
[07:06:10] and there we go let's merge this pull request and let's go back here and let's
[07:06:16] go ahead and go back to main and let's synchronize our changes again
[07:06:22] and once you've done that go inside of source control graph and just confirm that you merged the 13 successfully
[07:06:30] amazing amazing job that marks the end of this chapter and see you in the next one
[07:06:38] in this chapter we're going to develop the homepage this will include creating the home layout the homepage component
[07:06:45] which consists of project form and project list let's go ahead and let's
[07:06:50] start our app running npm rundev in one terminal and starting in justestdev
[07:06:56] server in the other and now let's go ahead and make sure we are on the main branch and you can click on synchronize
[07:07:04] changes just to make sure everything is up to date inside of your source control the last merge should be number 13
[07:07:12] now let's go ahead and let's fix one thing that's been bothering me so right now uh I'm loading my previous project
[07:07:20] here you can see that when the project loads no fragment is selected this is
[07:07:25] because in the messages container here we commented out this use effect which selects the last fragment because it was
[07:07:32] causing problems you can see that when I enable this then it works this is
[07:07:38] selected but it's annoying because if I want to select this one and look at it you can see that it automatically moves
[07:07:44] it after 5 seconds why after 5 seconds because we refetch every 5 seconds so
[07:07:51] this use effect can obviously be improved so let's go ahead and make it a little bit simpler i'm going to go ahead
[07:07:58] and remove everything in here for now and I'm going to start by adding a new ref right below the bottom ref add last
[07:08:06] assistant message ID ref which can be a simple use ref of a type of string
[07:08:13] and now inside of this use effect here let's go ahead and find the last assistant message so last assistant
[07:08:20] message we'll use messages find last and then simply find the message whose role
[07:08:27] is assistant so messages.findlast find the last API is that we are using and
[07:08:33] then in here we're going to open an if clause
[07:08:38] and what we are going to do is we're going to check if last assistant message
[07:08:43] fragment exists and if last assistant message do ID is not identical to last
[07:08:50] assistant message id refer let me just remove this so if that's the
[07:08:57] case only then are we going to call set active fragment and do last assistant message fragment and then we have to
[07:09:05] update last assistant message id ref.curren to be last assistant message
[07:09:12] id and this way we won't have any unnecessary updates and we can remove this to-do here so let's go ahead and do
[07:09:20] a refresh again and there we go so you can see how it selects the fragment the last assistant message it it can find
[07:09:26] but if I manually select this one let's wait for 5 seconds and you can see that nothing will change it right simply
[07:09:34] because this last assistant message ID ref is stored so the only time that we
[07:09:42] are going to override users selection is if an actual new message arrives i think
[07:09:48] that's an okay UX if you want to you can uh improve this logic even further by
[07:09:55] creating two separate states one for the automatic selection of the active
[07:10:00] fragment and one for the user selection of the active fragment and then you can overrule one over the other if that's
[07:10:07] something you prefer because you can see now nothing can change the fact that this fragment is active unless I do
[07:10:14] build a yellow landing page so if I add this still nothing is
[07:10:22] happening i'm still uh having this older fragment as selected only after uh this
[07:10:29] finally responds with some new content will the new fragment be automatically
[07:10:35] selected because it is constantly looking for the last new assistant
[07:10:42] message so our message wasn't able to trigger that use effect and if it simply
[07:10:49] calls the refetch request and it receives the exact same messages we
[07:10:54] compare the last message ID with our ref ID and if it's the same no we don't
[07:11:01] change anything and there we go you can see how it works i didn't change anything it just generated a new landing
[07:11:07] page and it selected that fragment that is the exact behavior we hoped for
[07:11:13] amazing so what I want to do now which you know you can choose if you want to or not i just want to remove this handle
[07:11:20] from here i don't like it so this is what I'm going to do i'm going to open
[07:11:25] both the project view and I'm going to open the file explorer and the only thing I want to do in the file explorer
[07:11:32] is copy the class name from the resize handle and then I'm going to go inside of the project view i'm going to find
[07:11:38] the resizable handle here remove the prop with handle and just paste the class name here and there we go now I
[07:11:45] have this type of resizable and there seems to be some kind of problem you can see when when you have two resizables
[07:11:51] active you can only move one of them right so you can't move this one i'm
[07:11:57] going to explore at the end of the tutorial if that's something we can fix there might be some solution but you
[07:12:03] know it's it's not too big of an issue great so now let's go ahead and let's actually uh build the homepage
[07:12:11] so we're going to go and do the following inside of your source app folder create a new folder home this is
[07:12:20] a route group this will not be a part of the URL but it can hold things like
[07:12:26] layouts so let's go ahead and build a simple home layout here the first thing
[07:12:31] we have to do in a layout is create props which hold the children and then we have to do a default export like this
[07:12:38] and in here we assign the props and we extract the children and then inside of
[07:12:45] here let's add instead of div let's add main and let's give the main a class name of
[07:12:52] flex flex column minimum height of screen and the maximum height of screen
[07:12:58] like so and in here let's add a div with a class name flex one flex flex column
[07:13:07] ex four and padding bottom of four and inside render the children
[07:13:15] and then what I want you to do once you have this layout tsx it is important that this is called layout this is a
[07:13:22] reserved file name just like a page right so it's important that you use
[07:13:28] layout and it's important that you do a default export here what I want you to do now is I want you to uh move the page
[07:13:36] tsx from the app folder the global one and drag it inside of the home folder so
[07:13:42] move it inside and sometimes this can trigger some unsaved files so if you get
[07:13:47] any unsaved files here you can just close them and if it asks you if you want to save it or not you can just
[07:13:53] click yes if nothing happened you can just continue what basically happens if
[07:13:59] that does happen to you is cache right the hot reload is currently active so
[07:14:05] sometimes the cache inside of this folder gets confused when you move a page that's currently uh active so what
[07:14:11] did we do now well if you go and click back to the dashboard nothing changes
[07:14:17] right that's because what we just did is we created a layout for all of our uh
[07:14:24] homebased pages right now this doesn't make too much sense because we only have one page the homepage right but later in
[07:14:32] here we're also going to have pricing and we're also going to have login forms so that's why instead of copying this
[07:14:39] code every single time into each page we're just going to uh create a nice
[07:14:45] little uh reusable layout like so now in here let's go ahead and let's do the
[07:14:51] following i want to create a uh self-closing div like so and give it a
[07:14:57] class name of absolute inset zero minus Z 10 height of full width of full bg
[07:15:07] background on dark use bg radial-ashgradient
[07:15:13] like so and then inside of here write 39
[07:15:19] 9 so 3 93 E48_1
[07:15:24] pixel comma transparent
[07:15:29] and then underscore one pixel so this is all one class name dark background
[07:15:36] radial gradient transparent right so all of this is one class name what's important is that when you hover over
[07:15:42] this if you have the tailwind extension you should see the underlying CSS if you
[07:15:48] accidentally add space somewhere that breaks the class you can see how now it's not working so just be careful
[07:15:53] don't add any spaces i mean this is not important this is just for a cool effect you're going to see in a second uh and
[07:16:00] now what I want you to do is I want you to copy this again paste it but without
[07:16:06] the dark prefix here and you're going to change the color of this to not be this
[07:16:12] one but instead be da d2 and this can still be transparent and
[07:16:18] then just add another one background dash size 16 pixels underscore 16 pixels
[07:16:28] and now you will see a bunch of dots all over your page so now let's go ahead and
[07:16:35] let's actually develop this so I'm going to go back inside of my homepage right
[07:16:41] here and we're going to do the following i'm going to remove all of these things
[07:16:46] here because we're not going to need any of them i'm going to well I'm just going to
[07:16:53] clean the entire thing i don't even need use client here i'm going to open a div
[07:16:58] and I will add a class name here flex flex column maximum width of five excel
[07:17:06] maximum width of auto and width full i will then add a section with a class
[07:17:13] name space Y6 py
[07:17:19] of 16 pixels my apologies 16 VH to Excel
[07:17:25] will be py 48 now inside of here I will add a div with
[07:17:32] a class name flex flex column and items
[07:17:37] center in here we're going to render an image from next image with the source of logo
[07:17:45] SVG out of vibe width of 50 height of 50
[07:17:53] class name of hidden MD block outside of this div encapsulating that image I will
[07:18:00] add an H1 build something with vibe or the name of your project and we're going
[07:18:08] to put this heading give this heading class name text to Excel medium text 5
[07:18:14] Excel font bold and text center and you should already be seeing something here
[07:18:22] now below this heading add a paragraph create apps and websites by chatting
[07:18:29] with AI and give this a class name of text large medium text extra large text
[07:18:38] muted foreground and text center there we go
[07:18:45] and now below that add a div with a class name maximum width of 3 Excel MX
[07:18:53] auto and width full and nothing will appear now that's because we have to
[07:18:59] create a new component called project form now the cool thing about project
[07:19:06] form is that you already built this you just don't know it so what we're going
[07:19:12] to do is we're going to reuse one component that we already have and we're
[07:19:18] going to go inside of modules projects UI components and in here we have the
[07:19:23] message form now technically we could modify this message form with a prop you
[07:19:29] know I could just pass a prop here like is homepage is landing page and then we could modify the CSS but honestly I
[07:19:36] would rather keep components separate than creating this magical components which can be used a million times right
[07:19:43] i'm okay with copying my code if it's for one two three instances i'm I would
[07:19:48] rather do that than creating this ambiguous abstract code that's impossible to keep track of right so
[07:19:54] this is what I'm going to do instead i will copy that message form and I'm going to go ahead inside of modules and
[07:20:01] I will create home module and inside of here UI and then components and then in
[07:20:08] here I will create project form.tsx and then I will copy everything inside
[07:20:14] of the projects UI components message form and I will paste it here like this
[07:20:20] and then I will remove the props because we don't need them and this will now be called project form there will be no
[07:20:27] props for this the value will still be the same but it will not be creating a
[07:20:33] message it will be creating the project so this will be called create project
[07:20:39] so let's go ahead and see what we have to do we will reset the form uh actually
[07:20:44] we don't have to reset the form and I'll tell you why because on success we're going to uh reinvalidate anyway so let's
[07:20:52] go ahead and do this after we reset the form the only thing we should actually oh I'm sorry after we successfully
[07:20:59] create a project the only thing we should do is we should call PRPC.pro and we should just refetch get many
[07:21:06] that's the only thing that should happen and then also we should invalidate the usage status so we can leave this to do
[07:21:12] and the same thing for this but also one more thing that should happen here is that we add router use router from next
[07:21:19] navigation let me just move this here
[07:21:24] when you successfully do this let's do router.push and we push to the newly created project
[07:21:31] so that's going to be forward slash projects data id as always we have this data because
[07:21:39] in the projects create procedure here when we create the new project and then we invoke a background job we return
[07:21:46] that new created project so we have access to it right here great so on
[07:21:51] submit we'll be calling create project and we don't need the project ID here at all for the is pending we will have
[07:21:59] create project is pending like so we can remove the show usage uh from here
[07:22:05] entirely we don't need it on the homepage so you can remove this show
[07:22:10] usage here like so uh what would you like to build can stay the same to
[07:22:17] submit to submit honestly I think everything else here works just fine so
[07:22:23] yes just a slight modification here and now let's go ahead and use it inside of
[07:22:31] our app homepage.tsx let's import project form from modules
[07:22:37] UI components project form and I think we also need to add use client here
[07:22:43] because it's imported in a server component so it wouldn't work and there we go this is how it's going to look
[07:22:48] like and you can already try it so build a
[07:22:53] landing page i like to use this example because I think it's super simple and works almost every time and there we go
[07:22:59] you can see what happens so from the landing page we create a new project with build a landing page initial
[07:23:04] message perfect so if you want to you can wait for the result uh I know it's very fun to always see the results so I
[07:23:11] I completely understand if you want to but I'm going to go back to the project form and what I'm going to do now is I'm
[07:23:18] going to show you how you can create some predefined prompts for the users so that they can easily click on them here
[07:23:24] so it's so that they can see the results faster so this is what we're going to do we're going to do this inside of the
[07:23:29] project form so in here go outside of this
[07:23:35] native form elements and create a div with a class name flex wrap justify
[07:23:43] center gap 2 hidden MD plex and a
[07:23:48] maximum width of 3XL and now in here what you should do is
[07:23:54] you should create something called project templates
[07:23:59] so you can go inside of the public assets folder which you can see the link for on the screen or you can use the
[07:24:05] link in the description and in here you can find uh constants.ts ts and in here
[07:24:11] I just created a bunch of project templates for you uh and you're going to have to you know test each of these out
[07:24:17] depending on the model you will use and what works for you and what doesn't because it's a good idea to showcase
[07:24:23] your project templates on something that you know will always work with your AI model right so I'm going to put this
[07:24:30] inside of home i will create new constants ds and I will paste that here so basically something like build a
[07:24:36] Spotify clone build an Airbnb clone build a store page YouTube clone file manager and I'm just using very
[07:24:43] descriptive prompts here because it will work better if you give it a good description but the cool thing is that
[07:24:50] you know you have full freedom to improve the prompt in any way in here when I select build a Netflix clone the
[07:24:57] full prompt will be build a Netflix style homepage with a hero banner uh use a nice dark mode compatible gradient
[07:25:04] here movie sections responsive card and a model for viewing details using mock data in local state use dark mode right
[07:25:11] so it's a very descriptive uh prompt but depending on what model you use you might be able to do it with just build a
[07:25:19] Netflix clone right it will just depend on the prompt that you're using and the
[07:25:24] model that you're using for example Claude Sonet understands uh your instructions very very well but with
[07:25:31] OpenAI I sometimes have to tell it you know if you're using dark mode make sure
[07:25:37] you use Next themes because you have Shhatzen installed right i have to tell
[07:25:43] it uh a more in-depth about what's going on so make sure you have this project
[07:25:48] templates and now what you're going to do is you're going to iterate over them so project templates which I've just
[07:25:55] imported from dot dot /constants here dom and for each template
[07:26:04] I'm going to return a button component I'm going to give the button a key of
[07:26:11] template dot title and then I'm going to add some additional attributes to the
[07:26:17] buttons so variant of each will be outline size will be small class name
[07:26:25] will be background white and dark background sidebar
[07:26:30] on click here on select will be called which we don't have yet so let's just leave it as empty
[07:26:36] and then let's put template emoji and let's put template title
[07:26:42] and let's see that now and there we go so you can see that now beneath this big
[07:26:47] input bar uh you can select any of these so let's go ahead now uh and just
[07:26:54] properly space these things out so what I want to do is I want to wrap my form inside of a
[07:27:01] section with a class name space Y
[07:27:07] six like so and just encapsulate all the way to here like that and then you can
[07:27:14] indent the entire thing and now you have a nice space in between
[07:27:20] and now we have to create the ability to actually select this so for this I'm
[07:27:26] going to add const on select content string
[07:27:31] form set value content or whatever you use let's see so we use uh value is the
[07:27:39] one we use so set value to be content or you know you can just put value here a
[07:27:46] lot of value uh and what's important you do is you enable all three should to
[07:27:53] true should validate to true and should touch to true this will basically simulate it to be in the same state as
[07:28:00] if the user actually typed this so now what you have to do is you have to add the on select to the buttons so call on
[07:28:08] select and pass in the template.prompt like so so now when you click on build
[07:28:15] an admin dashboard there we go you can go ahead and run this so I suggest that
[07:28:22] you try running this and also keep in mind some of these are larger tasks so
[07:28:27] they might actually time out right so be mindful of that the good thing about uh
[07:28:34] ingest is that if it notices a rate limit it won't retry immediately it will
[07:28:39] it will retry with exponentially longer pauses between each retry which if you're using Open AI is perfect because
[07:28:46] Open AI has reasonable timeouts so when you hit a limit in Open AI they punish
[07:28:52] you with like 2 seconds of waiting time so inest will wait for even longer than
[07:28:58] that and if it happens again it will wait for even longer so you don't have to worry ingest and OP and I are quite a
[07:29:04] good combination uh and you can see that with this longer prompt right where I
[07:29:10] told it let me just see create an admin dashboard with stat cards placeholder all of those things blah blah blah and
[07:29:16] here it takes a bit of a longer time you can see almost a minute but as I said you can speed these things up by using a
[07:29:23] different model you can create a smoother prompt right a lot of things you can do so let's just see this result
[07:29:29] i'm very curious if it will work or not and there we go so almost the exact same thing as we saw uh in the initial demo
[07:29:38] amazing and you can see the code here very very good so I would suggest that
[07:29:44] you you know try a couple of these and if some are obviously failing well you
[07:29:49] can try and you know fix them in the prompt or you can simply replace them with something simpler because if you're
[07:29:55] actually building this as a business it's a good idea that you you know allow the user to select something that will
[07:30:02] 100% work right you don't want to give them something that might work or might fail right perfect and I'm just super
[07:30:10] interested let me just go back here i want to change this to dark mode i want to see how this looks like looks pretty
[07:30:16] good great uh but I actually prefer working in light mode so let's go ahead
[07:30:22] now and let's develop the bottom part which is the project list so so far we
[07:30:28] created the project form and the layout now let's create the project list in order to do that we have to go back to
[07:30:35] our page dsx where we render the project form and we have to render the project
[07:30:42] list outside of this section so project projects list like this
[07:30:50] and then let's go inside of our home modules here so home UI components
[07:30:56] projects list.tsx let's mark this as use client and let's
[07:31:03] import everything we need here so link from next link and image from next image
[07:31:11] format distance to now from date FNS use query from tanstack react query
[07:31:21] and use tRPC from TRPC client and button from components UI button let's export
[07:31:27] cons projects list here and let's start by defining the RPC
[07:31:34] then let's define data projects to be use query
[07:31:39] DRPC projects get many query options
[07:31:45] like that and then in here let's return a div with a class name full width
[07:31:53] background color of white dark background color sidebar rounded extra
[07:31:59] large adding eight border flex X flex
[07:32:05] column gap Y 6 SM gap Y4
[07:32:10] then let's add an H2 element which will just say previous vibes or saved vibes
[07:32:19] i thought it would be fun to call old projects vibes because the project name is vibe right you can of course just say
[07:32:26] old project saved projects whatever you want so text to Excel and font semi bold
[07:32:33] later this will say Antonio's vibes or whoever is logged in but since we don't have out yet we can't display that just
[07:32:39] yet so now let's just import the projects list simply so we can start seeing the progress so right here at the
[07:32:48] bottom you should see saved vibes right here it should look like this
[07:32:55] so now let's go ahead below this and let's create a div with a class name of
[07:33:01] grid grid columns 1 SM grid columns three and gap of six and then in here
[07:33:10] check if projects.length this should be a question mark so if
[07:33:15] projects.length length is equal to zero in that case let's display a div with a
[07:33:21] class name all span full and text center
[07:33:26] and inside a paragraph no projects found
[07:33:31] and a class name text small and text muted foreground
[07:33:36] otherwise let's do projects do map get the individual project here
[07:33:44] and then return a button give this button a key of project ID a
[07:33:52] variant of outline and a class name font normal height auto justify start full
[07:34:00] width text start and the padding of four and give it an as child prop then go ahead
[07:34:08] and add a link here with a dynamic href forward slash projects project
[07:34:16] id and then inside of here create a div
[07:34:22] with a class name flex item center and gap x of four then add an image here
[07:34:29] with a source of logo SVG out of vibe
[07:34:35] width of 32 height of 32 and the class name object contain below the image add
[07:34:43] a new div with a class name flex and flex column
[07:34:50] inside of that div they have an H3 element with project.name name inside
[07:34:58] and give the H3 element a class name of truncate and font medium and below it a
[07:35:05] paragraph using format distance to now which we imported from date FNS
[07:35:11] project updated at add suffix true and give the paragraph a
[07:35:19] class name text small and text muted foreground and that is it so in here now you can
[07:35:27] see all of your previous vibes so you can go ahead and visit them and in here
[07:35:32] the source code is of course preserved great so I believe that that marks the
[07:35:38] end of this chapter where the goal was to build uh a
[07:35:43] the goal was to build uh a landing page and we added the templates we added the
[07:35:49] project list we added the ability to you know look at this older projects and I
[07:35:55] think we did an amazing amazing job here obviously there are some things still missing like the navbar but we will do
[07:36:02] that later when we add authentication so what I want to do in the next chapter
[07:36:07] is I actually want to improve the theme of this project because my original theme in the demo was some kind of
[07:36:13] yellowish color so I'm going to show you how I modify the theme to make it look like that and I'm super interested in
[07:36:19] the result of this so I'm just going to wait uh hopefully it will work if not you know it's just a lesson that these
[07:36:26] AI models are a bit undeterministic you can't really rely on them too much but
[07:36:32] if you spend you know more than uh I built this app in a span of a month
[07:36:37] right so I couldn't really spend too much time learning proper prompt engineering but if you actually use this
[07:36:44] for your business you are most certainly going to spend a lot of time on this and you will learn prompt engineering and
[07:36:51] you will learn how to improve the prompt and how to fix this little mistakes because in comparison to what you've
[07:36:57] just built an app failing is really not a big issue you can learn how to speed
[07:37:03] it up you can use a new model uh you can spend you know more credits you can
[07:37:08] basically do a billion solutions but the boilerplate is here and it's working
[07:37:15] so for example you can see that I've gotten an error for this file manager you might not get an error again it's a
[07:37:22] very simple fix it forgot to add use client to the top of the file we can see that in the file grid it was supposed to
[07:37:28] add use client but it didn't right or it should have added it to the page so
[07:37:33] perhaps this can be a very very easy fix you know you can maybe tell it inside of
[07:37:38] the prompt right here you can somewhere add a rule that it must add use client
[07:37:48] how about this let's add always add use client to the top of page tsx so
[07:37:58] because we are not expecting this to make any API calls right so then I can
[07:38:03] maybe remove this and I can just extend it and any other relevant files which
[07:38:09] use browser APIs or react hooks use effect okay I
[07:38:18] won't add too many tokens now but for example you can do things like this and I think that already uh this should work
[07:38:25] much much better and I purposely want to retry it now just to see if that will fix i'm trying to teach you that you
[07:38:31] know you don't have to use this prompt you can make your own prompt like I built this prompt and I have no idea
[07:38:36] about prompt engineering i just started very simple and then I extended and I extended and I extended right so I just
[07:38:43] added this file safety rule to always add use client at the top of page.tsx
[07:38:49] simply because uh if it does that it doesn't have to worry about adding it to the other places so let's see if this
[07:38:56] will fix the problem or maybe some new problem will arrive
[07:39:01] and finally I managed to get it to work so this was very funny it actually
[07:39:07] failed uh again right it forgot to add use client again but look at this it
[07:39:13] added it but it didn't add it at the top of the file so you can see how funny these AI models are sometimes you will
[07:39:20] lose your mind trying to tell it to do something right so this is what I did i modified this always add use client to
[07:39:28] the top the first line of app page tsx so this way it understood me and it did
[07:39:35] an interesting thing this time you can see that it understood what I wanted now
[07:39:40] and also it decided to create a whole new separate file where it created
[07:39:46] everything i'm not sure why it needed to do that um but let's see what it created
[07:39:52] because I think that this is very interesting actually can I rename this okay I can't do that oh I can one two
[07:39:59] three save oh it works i can rename i can delete or can I i can
[07:40:07] this is actually super impressive can I delete entire folders looks like something's wrong with the models keep
[07:40:13] in mind that sometimes the problems aren't in code but the problems are in the iframe right sometimes you might
[07:40:19] have to visit a live example wow this is actually a very very nice example of a file manager but yeah you can see that I
[07:40:26] had to struggle a bit with this right i got a very good result in the end but
[07:40:31] you know the prompt can always be better again I'm not a prompt engineer i have no idea what I'm doing when it comes to
[07:40:37] prompt engineering so spend some time learning that and you will get even better results than uh what I am in this
[07:40:44] tutorial but I still managed to get extremely impressive results great so I believe that that marks the
[07:40:51] end of this chapter now so 14 homepage let's go ahead and close everything here
[07:40:57] and I will go and create a new branch 14 homepage
[07:41:03] like so i'm going to stage all of my changes and I will create a commit 14 homepage i
[07:41:11] will commit and I will publish my branch perfect now let's go ahead and open a
[07:41:18] new pull request here and let's create a pull request
[07:41:24] and let's wait for the summary to arrive and here we have the summary we
[07:41:30] introduced a new homepage layout with a visually enhanced background and responsive design we added project
[07:41:37] creation form with template section validation and keyboard shortcut support basically a copy of our message form
[07:41:43] right we implemented project list view showing saved projects with quick navigation and relative timestamps we
[07:41:51] provided a set of predefined project templates for faster project setup we also fixed the fragment handling uh to
[07:41:58] prevent repeated state updates exactly uh and we also updated the resizable
[07:42:04] handle styling for a smoother and more interactive user experience and it also detected our prompt change where we
[07:42:10] clarified the requirement for the use client directive in relevant files
[07:42:16] excellent so in here as always we have a more in-depth walk through in here we
[07:42:21] have a sequence diagram explaining exactly how all of those things happen and in here we have some comments so it
[07:42:28] suggests adding some loading states here in the project list uh we could very
[07:42:33] much do that we could even leverage our pre-fetching and suspense we'll see how we're going to handle that later and in
[07:42:40] here it suggests also adding is dirty check i'm not sure if we need that i
[07:42:47] think I completed the project without it so I think we don't need this so I'm
[07:42:52] going to merge this pull request here and after I've done that I'm going to go back inside of the main branch and I'm
[07:42:59] going to click on synchronize changes and after that my graph here will update
[07:43:05] and it will show me that pull request 14 uh was just merged amazing amazing job i
[07:43:11] believe that marks the end of this chapter and see you in the next one
[07:43:18] in this chapter we're going to learn how to change the theme of our project and
[07:43:23] I'm going to show you two ways you can do that the first one is to simply visit my public assets folder or if you have
[07:43:30] access you can use the source code basically just visit the link you can see on the screen or the link in the
[07:43:35] description and from in here you can find globals.css
[07:43:40] and in here you can click copy or you can you know manually select and copy things and then go inside of your source
[07:43:49] app globals.css ensure that you are on your main branch
[07:43:54] and you can synchronize changes if you aren't sure make sure that the last merge was 14 and simply replace the
[07:44:01] entire globals CSS file so in here uh
[07:44:07] alongside changing all the colors this will update as well this is basically
[07:44:12] what enables button to have a cursor pointer just in case you were wondering
[07:44:18] so this is new and basically the colors were modified and if you take a look at
[07:44:23] your app now you will see that we have this new orange color and if you go to
[07:44:28] the dashboard you will see that it's more of a yellowish color so this is the one that I like but I want to show you
[07:44:36] exact place where I found this and how you can create your own uh CSS theme so
[07:44:44] for now what I'm going to do is I'm just going to revert this simply so it is the
[07:44:49] old global CSS you don't have to right if you like the theme you can copy from my uh GitHub assets you can use it but
[07:44:58] let me show you how I even found that theme i basically used tweak cn.com
[07:45:04] again you can use the link in the description or the link you can see on the screen and in here you can go inside
[07:45:10] of try it now and you can basically click here and find a bunch of different
[07:45:16] themes for UI and I think it is super cool and the one I selected was cloth
[07:45:23] right and in here you can check how it looks in light mode and how it looks in dark mode i think this is an amazing
[07:45:29] project it has so many themes you can try from so I purposely want to pick uh
[07:45:35] some theme that I haven't tried before let's see how about I try this
[07:45:41] claymorphism so the way you would do it is you would click on code and in here
[07:45:47] you can see that they are taking care of Tailwind versions right so I would take Tailwind version 4 and if you want to
[07:45:54] you can just use the CLI to do it but you can also just copy this and then you
[07:46:01] will have to replace your root your dark and theme inline so let me
[07:46:08] show you how you would do that so starting from the theme inline root and dark we select all of these and you can
[07:46:16] remove them so this is how the global CSS looks now and you just paste the new one here and that changes the entire
[07:46:24] look of your app as you can see it looks very different now right so if you like this one you can use this one right i
[07:46:31] personally like the look of Claude so I'm going to select Claude right here
[07:46:39] code uh code and I will click copy and then the same thing you basically select
[07:46:46] the root the dark and theme inline and you can delete it so this is how it
[07:46:52] should look like and paste your new ones here and then your app should look like this i think this is a very very nice
[07:46:59] look uh and it has nice borders everything just looks nice with this
[07:47:04] style again I don't know how well this website will be maintained i don't know
[07:47:10] if this will be available you know 2 years from now i hope it will because it's an amazing project but then again
[07:47:16] Shhatzen can update a lot and they will probably update the app accordingly to that so because of that I am offering
[07:47:22] you my globals.css which you can copy from the source code or the global assets and just paste the
[07:47:30] entire globals.css inside and if you're using this my globals.css you will
[07:47:37] notice that now buttons have cursor pointers they look clickable right each
[07:47:42] of these buttons look clickable that is because of this part let me show you
[07:47:48] this one so if you don't have this u it will not come with uh tweak CN so it
[07:47:54] doesn't come with this i added this myself in my global CSS so basically
[07:47:59] this is a way to enable cursor pointer for all buttons which are not disabled
[07:48:05] so you can add this little snippet if you want to and then your buttons will have proper uh cursor pointers i just
[07:48:12] think that this looks way better than everything than anything else right now let me try and go to one of my previous
[07:48:20] projects where I have a lot of fragments you can see how now fragments look clickable right they have a proper
[07:48:27] cursor on them great i am super satisfied with this one so I will leave it at this and while we are here there
[07:48:34] is just one more thing I want to do so just go in any of your projects and let's go ahead and do the following
[07:48:40] select your theme i would recommend using my global CSS and then later at the end of the project you can modify it
[07:48:47] to whatever theme you like but it will be easier for you to have the exact same result as me so that's why you can use
[07:48:54] my global.css keep in mind that this is for let me show you
[07:49:00] next version for next 15.3.4 four right
[07:49:05] so if you are watching this two years from now I have no idea if it will work for you and whatever is the latest
[07:49:11] version but if you're using a similar version like me uh or if you're using the exact version as me it will work
[07:49:18] great so now let's go ahead and do one more thing let's go inside of our button
[07:49:24] inside of source components UI button and in here I want to add a new variant
[07:49:29] called uh terriiary i don't know how to pronounce this to be
[07:49:35] honest i never I always mess this up but basically it's going to be background primary with 25% opacity in dark mode is
[07:49:44] going to be BG primary again but 30% opacity text will be primary shadow will
[07:49:51] be extra small hover will be BG primary 20
[07:49:57] bg primary 20 and on dark mode hover will be BG
[07:50:03] uh let me just check on dark mode hover will be BG primary
[07:50:09] 25% and now go inside of your project view here
[07:50:14] and in these tabs find the upgrade button and give it a variant of this
[07:50:22] new one however you pronounce this right and then when you look at it it will
[07:50:28] look like this it's a kind of uh lighter version and let me switch to dark mode
[07:50:33] and still looks good and of course check your app in dark mode to see it looks fine i very much like this look of the
[07:50:41] app more than all the other themes but you're of course free to choose your own and I like how this becomes orange now
[07:50:48] when you resize your panels uh great so this was a very very easy chapter so
[07:50:55] let's go ahead and just quickly merge this so mark this as complete and 15
[07:51:01] theme i'm going to open a new branch here let me just see what did we all
[07:51:06] change we'll change this to 30 this new variant here and we changed our theme
[07:51:11] overall so I'm going to create a new branch
[07:51:18] 15 theme i'm going to add all of the changes 15 theme i'm going to commit and
[07:51:25] I'm going to publish the branch and there's really no need for any review because this was a super simple uh
[07:51:31] change so I'm going to immediately merge this pull request so we speed things up
[07:51:37] there we go so just three simple changes and we can immediately merge it we don't need to
[07:51:43] wait for any review this time it's much simpler and after that's done let's go
[07:51:49] inside of main and let's synchronize our changes and then your last merge here
[07:51:55] should be 15 theme amazing amazing job and see you in the next chapter
[07:52:04] in this chapter we're going to add authentication to our project this will include creating a clerk account setting
[07:52:11] up clerk creating the necessary components to display the authenticated state creating protected TRPC procedures
[07:52:19] and updating the Prisma schema let's start by creating the clerk account you
[07:52:25] can use the link you can see on the screen or the link in the description and once you get to the landing page you
[07:52:32] might see something interesting in here where they mention the companies that
[07:52:37] use clerk you can actually find injust the company that we are using for our
[07:52:42] background jaws and you can confirm that yourself by going in their signin screen
[07:52:47] and searching for clerk inside of their network tab and in here you can see that they are actually making requests for
[07:52:53] clerk and I just think it is super interesting that such a uh great company uses the same authentication system that
[07:53:00] we are going to implement in our project right now so let's go ahead and do that once you create your account here you
[07:53:06] will be redirected to the dashboard and in here you can click create application
[07:53:12] i'm going to call this application Vibe and I'm going to enable email and Google you can of course enable all of these
[07:53:19] other providers if you want to and I will click create application
[07:53:24] after we do that we have to install the Nex.js clerk package but just before you
[07:53:30] do that ensure that you are on your main branch ensure that your last change was 15 theme and that you have synchronized
[07:53:37] all of your changes now let's go ahead and let's run npm install lurk nex.js and once it's been
[07:53:45] installed I'm going to show you the exact version that I will be using 6.23.0
[07:53:52] now that we have that let's go ahead and add the environment variables to our environment file so I'm going to go
[07:53:59] ahead and add clerk and paste these two i like to wrap them in parenthesis but I
[07:54:05] think this might depend on the system i think Windows might have problems with this uh but I think maybe even not i
[07:54:12] think all of these will work just fine but yeah in case you were wondering I
[07:54:17] like to wrap them in parenthesis they don't have to be in parenthesis so all of these could actually be without
[07:54:23] parenthesis if that's something you prefer i just feel like the syntax looks better with parenthesis
[07:54:31] uh I keep saying parenthesis I mean quotes sorry uh okay now let's create our middleware file so that's going to
[07:54:38] be inside of the source folder create middleware.d DS make sure to not misspell this middleware.ds
[07:54:46] it's a reserved file name we import clerk middleware from clerk next.js server and we export default clerk
[07:54:52] middleware middleware and we add a matcher so uh we target all of these files here
[07:54:59] excellent so now that we have this let's go ahead and let's add the clerk provider to our layout so I'm just going
[07:55:06] to import clerk provider to our root layout so app folder layout
[07:55:12] let's go ahead and import clerk provider from add clerk next.js
[07:55:21] and I'm going to wrap the entire application inside of a clerk provider yes make sure you wrap your TRPC React
[07:55:28] provider inside of clerk provider as well like that so let me just confirm that I use the correct package and just
[07:55:35] confirm that they've done this as well perfect and now let's go ahead and let's
[07:55:40] do npm rundev here you don't need to start your uh ingest right now because
[07:55:48] we will be doing some other things so what I did is I went to the end here and I clicked on next steps utilize your own
[07:55:55] pages for authentication the account portal is the fastest way to add authentication so let's click continue
[07:56:00] to the next GS guide and the first thing we're going to do is we're going to add this uh sign in pages so let's go ahead
[07:56:08] and do that i'm going to go inside of source app home here and now I'm going to create a
[07:56:16] new folder called sign in and then inside I will create another folder
[07:56:21] which will use the catch all route sign in like this it needs to be exactly like
[07:56:26] this and then page.dsx inside and now let's go ahead and let's import sign in
[07:56:36] from clerk nextjs and let's do a page
[07:56:41] export here with a div which will have a class name of flex flex column maximum
[07:56:49] width of 3 excel mx out and width pool and then let's add a section which
[07:56:58] includes a class name space Y 6 padding top of 16 VH and to Excel padding top of
[07:57:07] 48 inside of this section add a div with a class name flex flex column items center
[07:57:17] and inside of here render sign in whoops
[07:57:23] sign in like this and once you've added this you can go ahead and copy this and
[07:57:31] you can add sign up here like so and then change this to be sign up as well
[07:57:38] go inside of the sign up page and replace sign in import with sign up import
[07:57:45] and then let's go ahead and do the following so we're going to set this to be public
[07:57:52] route so we are going to go inside of our middleware.ts
[07:58:01] we're going to import create route matcher right here and we're going to define a
[07:58:06] constant is public route using create route matcher and we are going to target
[07:58:12] sign in and then we're going to change this
[07:58:17] expert default clerk middleware to include an arrow function which checks
[07:58:23] if the current request is not a public route and then it will redirect to the
[07:58:29] protect page and then what we have to do is we have
[07:58:34] to modify our environment variables so let's go ahead and go inside of
[07:58:40] environment variables here and let's add that next public clerk signin URL is
[07:58:47] forward slash signin and the fallbacks will be an empty forward slash so next
[07:58:53] public clerk sign in fallback redirect and next clerk sign up fall back redirect urls perfect and now I think
[07:59:01] that already you should be able to see this if you go to localhost 3000 I think you should immediately be redirected to
[07:59:08] this page right and if you try to visit any other page like try to visit some
[07:59:14] older project like projects 1 2 3 you get immediately redirected back to the signin page so
[07:59:21] all pages are now protected we are of course going to slightly modify this by
[07:59:27] going inside of the middleware and let's modify this array of public routes to
[07:59:33] also include a forward slash and I like to use these types of quotes and we also
[07:59:41] uh actually yeah I think this uh we also need forward slap API inest
[07:59:51] like this so make sure you add this otherwise background jobs will not be able to work so we need to allow inest
[07:59:58] to be contacted great so once you've done this you should now be able to visit the
[08:00:04] localhost 3000 page there we go you can see that now we can visit this but we still can't visit the individual project
[08:00:11] page so uh and yes I am in dark mode you might be in light mode it doesn't matter
[08:00:17] so now let's go ahead and do the same thing that we did
[08:00:23] let me just go here the same thing that we just did for sign in we are now going
[08:00:28] to do to the sign up page so we just did this so we don't have to do it i told you like already that you can just copy
[08:00:34] the sign in and do it right here but what we need to do is we need to add
[08:00:40] sign up to the list of our public routes so let's see did we do that or not we didn't so let's add it
[08:00:48] there we go so sign up is now added to the list the same as sign in and then we
[08:00:53] also need to add all the environment variables here so let's go inside of environment here and let's just add some
[08:01:00] so next clerk next public clerk sign up URL
[08:01:06] and the redirect URLs for sign up fallback and sign in fallback
[08:01:12] and looks like these are duplicates so yeah I think you only need one of these
[08:01:18] and one of these so yeah you can do remove these two and just move these two there we go at least I think that they
[08:01:25] were duplicates right i think they were uh and now you should be able to go uh
[08:01:32] manually you can just enter any other route try going to projects one to three you will be redirected and if you click
[08:01:38] sign up you should be taken on the same layout as you can see it loads the sign
[08:01:44] up page so now you can switch between the two perfect uh so now what I want to
[08:01:50] do before we even log in I want to go back to localhost 3000 here and I want
[08:01:57] to create a navbar so let's go inside of our home module so
[08:02:04] that's going to be inside of source modules home UI components and in here
[08:02:13] go ahead and create navbar esx let's go ahead and mark this as use
[08:02:19] client and let's import link from next link let's import image from next image
[08:02:26] let's import all of these from clerk next.js signed in signed out sign in button and sign up button and then let's
[08:02:35] import button from components UI button let's export con navbar here and let's
[08:02:42] return a nav element give this nav element a class name of padding 4 background color transparent
[08:02:51] fixed top zero left zero right zero zindex of 50 transition all duration 200
[08:03:01] border bottom and border transparent inside of this div uh nav add a div with
[08:03:09] a class name of maximum width 5 xl mxal
[08:03:14] width full flex justify between and items center
[08:03:22] add a link inside with an href to a forward slash with a class name of flex
[08:03:29] item center and gap of two and in here render an image with a source
[08:03:37] of logo SVG out of vibe width of 24 and
[08:03:43] height of 24 as well add a span with a
[08:03:49] text vibe inside add a class name font semibold and text large like that
[08:03:57] and let's go ahead and let's go inside of our layout in app folder home layout
[08:04:06] and let's render it just so we can start seeing some results so navbar
[08:04:11] from modules home UI components navbar and you should now see the vibe right
[08:04:17] here at the top and the fun fact it should also appear if you go into out
[08:04:24] screens as well as you can see so now you can always use it to quickly go back
[08:04:29] so now let's continue developing the navbar here the first thing we're going to add after the link is we're going to
[08:04:35] add signed out state like this and then inside add a div
[08:04:42] with a class name flex gap 2 and add
[08:04:48] sign up button and add a normal button inside with a
[08:04:53] variant of outline and a size of small
[08:04:59] and render sign up inside you can copy this and then change
[08:05:05] this to sign in button this one will say sign in and this one won't have the
[08:05:12] outline variant it will just have a size small so there we go now you have sign up and sign in buttons that you can
[08:05:19] access only if you're logged out of course and
[08:05:24] then if you are signed in let's just add a paragraph to do user control
[08:05:32] and now we should be ready to log in so I'm going to click sign in here and I'm
[08:05:38] going to continue with Google and once you confirm your Google login
[08:05:44] you will be redirected back here and you should be redirected on the landing page with the text to-do user control like
[08:05:53] that and you can see how now we can also load these apps so the reason they previously weren't even loading uh is
[08:06:00] because in the middleware we didn't allow the TRPC to be a public route so
[08:06:08] in my case I'm not going to have any public TRPC procedures but if you want
[08:06:13] to you can also add TRPC here like this let's just fix this TRPC and
[08:06:21] then if you well you can't log out now so let's just create a component to log out now and then I will demonstrate this
[08:06:26] it's completely fine to add this here because we are going to protect TRPC routes based on their procedure type as
[08:06:33] well because right now if you wanted to have any public API routes they don't exist we prevent any anything other than
[08:06:41] this to be a public route uh also you can create the exact
[08:06:46] opposite right you can call this is private route and then all of these will
[08:06:51] be private routes right and then you would just modify your logic you would remove the exclamation point and you
[08:06:57] would do this so if you have the majority of the public routes and minority of the private ones you can
[08:07:04] just reverse the logic of the clerk middleware that's the cool thing about this it doesn't have to right we just
[08:07:09] called this is public route we could have called it anything and we could just put private routes inside and then
[08:07:14] use the reverse logic here right it's not like you need to add the public ones
[08:07:20] here so this is especially useful if you have a bunch of public routes then just do the reverse logic you know great now
[08:07:28] let's add the user control uh component so I'm going to go ahead and close
[08:07:34] everything i'm going to go inside of source components and I will create user control dsx i will mark this as use
[08:07:42] client and I'm going to import user button component here I will export
[08:07:48] const user control
[08:07:53] and I will create an interface props here to show name which is an optional
[08:07:58] boolean and in here I will add the props and show name
[08:08:05] then in here I'm going to return the user button component which is a self-closing tag
[08:08:10] and I will modify well first I will pass the show name prop and then I'm going to
[08:08:16] modify the appearance prop to include the elements and then get the user button box to be
[08:08:24] rounded medium with an exclamation point at the end which basically means important
[08:08:29] user button avatar box rounded medium with size eight
[08:08:37] eight and user button trigger rounded medium like so
[08:08:44] so I don't have to type this any every time I have uh created it in a component
[08:08:50] like this so now let's go back inside of our navbar and inside of signed in
[08:08:56] render user control and pass in show name prop so just make sure you have
[08:09:02] imported user control and there we go uh and in here you now have this uh name
[08:09:08] which is barely visible because I'm in dark mode don't worry we're going to fix that as well but from here you can
[08:09:15] access your entire account your security uh all of those things and you can also
[08:09:21] sign out from here and you can see that now since I enabled inside of my middleware TRPC I can fetch them right
[08:09:29] but if I remove this and refresh I'm not able to fetch them because all the
[08:09:34] network requests for TRPC are failing as you can see all of them
[08:09:41] are failing but we will protect our TRPC routes in a different way so it's
[08:09:46] completely okay in my opinion to allow this in fact you can even just allow your entire API like this then you don't
[08:09:54] have to worry about injust or DRPC specifically because our API should uh
[08:10:01] it should be protected in a different way in the first place let's just do a sanity check what do we have here we
[08:10:07] have ingest and we have uh TRPC so inest needs to be publicly available simply
[08:10:12] because inest will contact this no one else right and if you're wondering how
[08:10:18] this works they probably have some kind of uh security header which is checked every time you access this route because
[08:10:24] you can see that we're using the serve from ingest next so inside of here they probably have their own request handler
[08:10:31] that does all the security features inside and as for TRPC uh well we are
[08:10:37] going to be the ones who are going to have to protect each individual route here and that's what we are going to do with the protected procedure so I would
[08:10:45] actually recommend allowing all API endpoints to be public routes so now
[08:10:51] let's go ahead and let's uh create the dark mode for this because you can see
[08:10:57] that when I log in of course it just looks weird so what we're going to do is
[08:11:03] we're going to go and create a hooks folder so go inside of source uh do we we
[08:11:09] already have hooks great so this came with chats and UI and now create use
[08:11:15] current theme.ts so we already have use theme from next
[08:11:23] themes and we already use it in the project header use theme the problem
[08:11:28] with this is that it has uh the following possible values it can be
[08:11:35] system dark or light which is fine for this radio group but if the value is
[08:11:42] system what exactly is that is it light or is it dark we
[08:11:48] don't know that's why we have to create a custom use current theme here
[08:11:55] where we can extract the theme and system theme specifically
[08:12:02] use theme like that and then if theme is dark
[08:12:08] or if theme is light we can just return the theme as usual otherwise return the
[08:12:17] system theme like that because you you cannot always just
[08:12:24] return the system theme this only makes sense if the theme is system right if
[08:12:31] it's dark or light then we don't care we can just return whatever the value is but if it is something other than dark
[08:12:36] or light it means it is system so then we cannot return theme we have to return the actual value of the system theme and
[08:12:44] now we can go inside of the user control right here and we can adapt it as follow
[08:12:52] const current theme use current theme
[08:12:59] like this and then inside of here uh let's also
[08:13:06] import i think we need to install a package first so let's just do npm
[08:13:11] install at clerk forward slash themes and I'm going to show you my package
[08:13:16] json here 2.2.51 is my version and then from that package
[08:13:24] you can now import dark from clerk themes and then very
[08:13:30] simply in the appearance here set the base theme to check if current theme is
[08:13:37] equal to dark use dark otherwise use undefined
[08:13:43] and now you can see the text is visible and this is now in dark mode
[08:13:48] so you might be thinking could I have just added that to the clerk provider because clerk provider also allows for
[08:13:55] the appearance and base theme well you can but the problem is the theme
[08:14:00] provider for SHAT CN needs to be inside of the body and clerk provider needs to
[08:14:06] be outside of the HTML so we kind of have a conflicting situation here right
[08:14:14] um you can try moving both the clerk provider and TRPC react provider here
[08:14:20] maybe but I'm not sure how that works right uh I'm not sure if it matters but
[08:14:27] uh from all the documentation I've seen these two need to be outside of HTML i'm
[08:14:32] not sure I could be wrong but basically if you are able to move these two like
[08:14:38] this inside then you can create an abstraction around cleric provider and then you can
[08:14:45] do the same thing like this but for now I'm going to leave it like this simply because this is what worked for me
[08:14:51] initially great so we now have this in the user control and we can now go inside of sign
[08:14:58] in and do the same thing because right now if I sign out and if I go here you
[08:15:04] can see that this uses light mode so let's go inside of sign in page right here let's go ahead and mark this as use
[08:15:12] client and let's import use current theme from
[08:15:17] hooks use current theme which we just created and let's import dark from clerk themes
[08:15:23] now in here we can extract the current theme and for this sign in let's add
[08:15:29] appearance here base theme we'll check if current theme
[08:15:35] is equal to dark and use dark otherwise use undefined and let's also modify the
[08:15:41] elements a bit by adding card box here do not have any border not have any
[08:15:46] shadow and be rounded for LG
[08:15:52] like this and there we go you can see how now this is in dark mode and when you click on sign up you can see it
[08:15:58] still uses the old theme so let's just go ahead we can just copy the entire file go inside of sign up paste the
[08:16:05] entire thing and replace the import to be sign up i think that's faster
[08:16:11] and there we go now both of our sign in and sign ups have the proper team great
[08:16:18] so let's see where we are what did we do we created a clerk account we updated
[08:16:24] updated our environment we added clerk provider signup screens middleware
[08:16:29] perfect we added home layout in the navbar we created the user control component now let's create protected
[08:16:36] tRPC procedures and let's update the Prisma schema
[08:16:41] so I just want to do one more thing with the user control component and that is
[08:16:46] inside of the project view so go inside of this component here and in here after
[08:16:52] the tabs list here we added this ML auto flex and this button to upgrade now next
[08:16:59] to it also add user control like this and don't add the prop show
[08:17:05] name so just make sure that you imported user control and let me show you how
[08:17:11] that will look like now so now if you of course sign in so let me just enter an
[08:17:19] account here and let me just go to uh any random
[08:17:25] project here you can see that I have my user button right here and let me just switch to
[08:17:31] light mode to see everything still works fine there we go you can see that now I can log out and access my account
[08:17:37] information from here as well and let's just double check the light mode to see everything works fine everything works
[08:17:44] just great perfect so now what we have to do is we have to create the protected
[08:17:49] TRPC procedures so in order to do that let's go inside of source tRPC
[08:17:56] and let's go inside of init and now in here we're going to modify the TRPC
[08:18:02] context here so what I'm going to do is I'm going to remove this comment
[08:18:07] and I will return al to be await out from clerk next.js
[08:18:15] server after that I mean just below it I'm going to export
[08:18:21] type context which uses awaited return type type of off create trpc context and
[08:18:27] you can actually find these exact instructions in clerk documentation here let me just find tRC maybe I can find it
[08:18:35] integrate clerk into your next.js plus tRPC app let me see if that is uh what
[08:18:40] I'm looking for here let's try again trpc
[08:18:46] I think this might be it so yes you can see that they instruct you to wrap the clerk provider around the TRPC provider
[08:18:54] so we already did that right we are using TRPC React provider simply because
[08:19:01] the documentation has changed since then but it's the same thing it's important that the clerk provider is wrapping
[08:19:06] around the TRPC provider and now in here we are basically doing this in the create context
[08:19:14] and we are creating the context type here like that and in here you can find all the other things that we are going
[08:19:20] to do uh for example they have a specific instruction to now add create context to this TRPC route but if you
[08:19:27] look at the TRPC route we already do that right so you don't
[08:19:33] have to worry about that you can just follow what I do now so I'm going to go
[08:19:38] after this T initialization and I will do const is outped like so and I will do
[08:19:45] T dot middleware and from here the structure next and
[08:19:51] context and check if not context out user ID
[08:20:00] in that case throw new TRPC error code
[08:20:07] uh let me just see what exactly is the problem in this one oh so I need to
[08:20:14] import TRPC error from TRPC server okay make sure you do this
[08:20:20] then let's do unauthorized here with a message of not authenticated
[08:20:27] like that nothing uh and then after this if clause
[08:20:32] return next and extend the context to include out
[08:20:39] now we have to fix this problems that out doesn't exist you can do that quite easily by going back to this t here and
[08:20:47] simply add dot context add the context type and execute it and
[08:20:54] you can see that now we have the al property here which we added here
[08:21:00] perfect and it's important that we also cache this in React so this doesn't need to be called every single time and we
[08:21:08] are simply relying on the user ID from it here so make sure you don't do any mistakes here because now we're finally
[08:21:14] going to go ahead down here and do export const protected procedure to be
[08:21:21] t.procedure whoops t.procedure
[08:21:26] is authored there we go now we have our protected
[08:21:32] procedure so now it's time to replace a lot of our
[08:21:37] previous uh well procedures with this new one so thankfully we don't have too
[08:21:44] many modules so let's start with the messages procedures here let's see at
[08:21:49] first we have get many instead of base procedure what you can do is honestly I
[08:21:55] don't think there will be a single public procedure here so what I like to do is I like to highlight base procedure
[08:22:01] and then I press command D or control D and then this just selects all of the
[08:22:07] other ones right so 1 2 3 and I can remove them and I can add protected
[08:22:13] procedure like this and nothing really changes now
[08:22:19] so I'm just now using protected procedure for each of these for get many for create and I think that's that's the
[08:22:26] only two instances and you might think but nothing really changed now that's
[08:22:31] right but look at this if I'm using so just for example I will bring back base procedure here for the get many I'm now
[08:22:38] using base procedure if I try to extract context from here and if I try to do uh
[08:22:45] let's for example imagine that we can query the messages by user ID imagine if
[08:22:51] I do user ID here and do context and then I try to do you know user ID in
[08:23:00] here it can tell me that the user ID is string or null so that means what I have
[08:23:05] to do is I have to first check if there is no context.out user ID and then I
[08:23:11] have to throw new tRPC error blah blah blah but that makes no sense we just
[08:23:17] created the protected procedure which does that for us and then uh passes the
[08:23:23] context further so instead what we do when we know that something has to be a
[08:23:28] protected procedure that we will always throw an error if the user ID is missing we can now just use the protected
[08:23:34] procedure and this time the user ID is a type of string see the difference base procedure tells
[08:23:42] me it can be string or it can be null but protected procedure tells me this is
[08:23:48] definitely a string because it 100% exists at this point so that's why we're
[08:23:54] replacing things with a protected procedure and then at this point it doesn't matter that our API is allowing
[08:24:02] the public route for API right an important thing you should know you
[08:24:08] should never never ever ever rely on the middleware for authentication
[08:24:15] so what I'm doing here is just a nice user experience right it is easy to
[08:24:22] redirect the user using the middleware but this isn't my line of defense
[08:24:28] this isn't what I'm doing to throw errors that's why I have a data access
[08:24:33] layer called TRPC and in here I have my protected procedures so if this middleware fails even even in this case
[08:24:41] I explicitly allow the middleware to allow API routes i'm still very much
[08:24:48] protected because I'm protecting my data access layer and you should do the same
[08:24:53] never ever rely on the middleware to protect your app if you want to use the
[08:24:58] middleware for nice user experience like we are of course you can do that but it
[08:25:04] shouldn't be your last line of defense you should have a data access layer and
[08:25:09] you should protect your routes individually because let's imagine this middleware breaks which can happen
[08:25:15] nex.js had a middleware security issue just a few versions ago and people who
[08:25:22] were shocked that that happened know got a very big security lesson you shouldn't rely on the middleware even if the
[08:25:29] middleware was perfect you should not rely on it uh don't confuse this
[08:25:35] middleware with this is also technically a middleware right we we just created a
[08:25:40] middleware this middleware and this middleware are two different things they are not comparable okay what I'm trying
[08:25:47] to tell you is don't try and do API and then projects and then create don't do
[08:25:55] this this is not enough for you to protect your API routes
[08:26:01] you should protect your API routes inside of the routes themselves like I am doing right now so this is a
[08:26:07] different type of middleware they're just using the same word they're using the same keyword middleware here and
[08:26:13] middleware here right i'm trying to explain the difference so whenever you
[08:26:19] use the middleware it should only be used to improve user experience like adding redirects which is very a very
[08:26:26] nice thing to use the middleware for but if your middleware breaks and if the user actually ends up being able to
[08:26:33] visit my individual project page I'm still just going to throw a bunch of
[08:26:38] errors because when we try to load the messages it will be a protected procedure and it will just throw the
[08:26:44] user an error saying "Hey you're not authorized i don't know how you access this API but you cannot see that API."
[08:26:52] That's how authorization should work not by the middleware the middleware is just
[08:26:57] the first layer of security the actual layer of security is the data access
[08:27:03] layer in our case the RPC i hoped I cleared that up sorry for going on this
[08:27:08] rant but it is important for you to understand that great so now let's go
[08:27:13] ahead and once we finish the messages let's go inside of projects server procedures and I think that we have to
[08:27:19] do the very same thing here i don't see a single thing that can be a base procedure here so I'm just going to
[08:27:25] replace All of these instances I think this is the last one yes with
[08:27:31] protected procedure so let me show you the exact changes get one get many and
[08:27:37] create so three procedures in this case and when I search for base procedure now
[08:27:46] not a single one exists except the actual instance here in the init file and when I search for protected
[08:27:52] procedure I have eight results in three files the third one being in it file so
[08:27:59] that's how your project should look as well so now only authorized users can
[08:28:04] access this API routes and it absolutely doesn't matter that we are not protecting it in the middleware
[08:28:11] perfect so now let's go ahead and let's add
[08:28:16] Prisma schema update because now we finally have the user ID so that means
[08:28:21] we can go inside of Prisma schema here and we can modify
[08:28:28] some things so let's start with the project the project from now on will
[08:28:34] have a user ID which will be a required string like this
[08:28:41] and since other entities relating to the project all other entities end up being
[08:28:47] related to the root project we don't really have to add it to the message as well you can of course do that if you
[08:28:55] want to uh if you have any architectural reason for doing that of course you can
[08:29:00] add individual user ID for the fragment individual user ID uh for the message
[08:29:06] right but for the same reason I'm not adding project ID into the fragment because the fragment is related to the
[08:29:12] message which has the project ID already i'm not going to be adding the user ID
[08:29:17] uh to my uh other entities because it is enough that the user ID is in the
[08:29:23] project and once I've done that I'm going to shut down my app and I'm going to do npx prisma migrate reset so again
[08:29:31] only do this in development we are clearing up our database because we are in development and we can do that and
[08:29:38] once we've done this let's go ahead and do npx prisma migrate dev and once it
[08:29:44] connects let's simply call this user ID or out
[08:29:49] here we go i'm going to call this user ID and there we go now I'm going to do
[08:29:55] npm rundev and I'm going to run npx inest cli latest dev so both things
[08:30:01] should be running and just double check that it was able to connect to API inest
[08:30:07] because as I said if you accidentally don't allow your API here then inest
[08:30:14] will not be able to connect there we go you can see that now it's 404 so that's
[08:30:19] wrong that's why you need to make sure to allow all of your API routes and then
[08:30:25] after some time let's check again it can connect to it exactly what we need so
[08:30:30] now let's go ahead and fix all of the issues that we have because we do have them we just got a new rule and that is
[08:30:37] that each project needs to have a user ID so let's go ahead inside of our
[08:30:44] modules and let's go inside of projects server procedures and we can already see
[08:30:50] some errors here such as the create error so in the create protected procedure we now have to also pass the
[08:30:57] user ID which we can easily extract from the context here because we are using a
[08:31:02] protected procedure so context.out user id as simple as that problem fixed now
[08:31:10] what we have to do next is you also have to modify the get many so whose projects
[08:31:16] are we loading very simple the currently logged in users projects so let's add a
[08:31:21] wear here like this user ID matches context out user ID and
[08:31:30] now we are only loading this currently logged in users project and same thing
[08:31:35] for get one simply extract context from here and we can only load the existing
[08:31:40] project if we have a matching user ID if we don't this will be null and we're
[08:31:48] going to throw the error not found so even if the user is logged in and manages to surpass this protected
[08:31:55] procedure we will still be able to throw the error because we have no idea which
[08:32:01] project with that specific ID and that user ID they are looking for so we just throw we have no idea what you're
[08:32:07] talking about we've never seen that project before so full security in our application and now we have to do the
[08:32:15] same thing but for messages so let's go inside of procedures here and let's
[08:32:21] check get many so in here I'm going to extract the context as well and I'm
[08:32:26] going to try and do project user ID and it seems like I can do that so let's simply add context out user ID there we
[08:32:34] go so just like that we are now also protecting all of our messages but since we don't have direct user ID in the
[08:32:40] message we have to go through the project ID first perfect and for the create uh well we
[08:32:48] have to do the same thing but a little bit differently here so what we're going to do here is we're going to do con
[08:32:54] existing project first await prisma project find unique where
[08:33:02] and simply add the ID to be input project ID and user ID to be
[08:33:11] context pal user ID like this
[08:33:18] i mean maybe we can somehow do it from here i don't know i'm not that good with
[08:33:24] Prisma but you can do it in two separate queries you know it's not the end of the world and if there is no existing
[08:33:29] project let's throw new TRPC error here code not found with a message
[08:33:39] project not found so I have no idea what where what project do you want to create
[08:33:46] this message into right and make sure you have imported the TRPC error from
[08:33:51] TRPC server so this way even if they somehow surpass the protected procedure
[08:33:57] we are still not going to allow them to just create messages in someone else's project because they need to match the
[08:34:03] exact user ID who created that project uh great so we now have this done right
[08:34:10] here and then we can safely do the created message you can even then use maybe it's even safer to use existing
[08:34:16] project ID for the project ID so it's only this one which we can query from
[08:34:22] our database with the correct user ID that we're going to insert this message into
[08:34:28] excellent and you don't have to worry about these background jobs because we are protecting them before we even
[08:34:34] trigger them so that is for the create method let's see did I fix it for the get many and I
[08:34:41] think that should be it so obviously we should now just test our app to make
[08:34:46] sure things are still working uh so let's go ahead and do the following let's go inside of our projects list now
[08:34:55] and I just want to do a slight modification here and that modification
[08:35:00] is that I'm going to load the current user from use user which you can import
[08:35:08] from clerk next.js and then this will allow us to do the following we can then
[08:35:14] do user question mark first name and then apostrophes
[08:35:20] users vibes and then in here also do if there is no user return null so we don't
[08:35:28] even load the project list if we are not logged in we can of course do this in a million ways but I think this is just
[08:35:34] simple enough for now uh great so you can see that when I am logged out
[08:35:40] nothing happens here great so what I want to do first is I want to go inside
[08:35:46] of my project form and in here in my
[08:35:53] on success specifically on error I should redirect the user to the out
[08:35:58] screen as well if this fails because right now when I type test I'm just
[08:36:04] getting an error not authenticated i mean you could technically argue that's good enough but uh let me show you what
[08:36:11] you can do so you can do router and then you can just push the user to sign up or
[08:36:16] sign in that's an easy way you can do but here's a cool thing you can actually do con clerk use clerk from clerk.js
[08:36:24] so just make sure to add this import and once you have it you can do the
[08:36:30] following if error data.code is equal to unauthorized
[08:36:39] you can do clerk.open sign in like that uh and let me just so
[08:36:46] error data is possibly undefined so maybe I need to do this there we go and
[08:36:53] let me just move this to the top so this way if this fails it will open the
[08:36:58] signin model so I write test and there we go it opens this nice model
[08:37:04] i think it looks cool if you want to you can also just do you know router.push
[08:37:10] sign in that also works there we go so whichever one you prefer
[08:37:16] i just thought I would show you this cool alternative uh great so I'm pretty sure that we
[08:37:26] don't have to do anything more besides test the app so now I'm going to log in here
[08:37:32] and as you can see it says Jones Vibes and no projects found and I will do
[08:37:37] build a landing page here and let's see will I get any errors i
[08:37:43] don't think I'm getting any errors at all i do want to just check my functions.ts just to confirm I'm not
[08:37:49] getting any errors in here even though we shouldn't be getting any errors at all this is a background job this
[08:37:55] doesn't need any user ID i think everything is just fine here and I think that we will be able to normally
[08:38:02] load the messages but let's wait and see the result and there we go once I am logged in you
[08:38:10] can see that I can normally create my messages i can even refresh this and I can load my messages i can see my
[08:38:16] fragments so all of this is obviously working perfect uh and let's try
[08:38:22] something fun i'm going to copy the URL here and I will log out and then I'm
[08:38:28] going to go ahead and paste that URL so obviously I'm getting redirected but let's say inside of my middleware I
[08:38:34] accidentally do projects and I do this all right so let's see
[08:38:39] what happens then you can see that even if the middleware fails
[08:38:45] nothing useful is shown to the user and finally an error is thrown this is of
[08:38:52] course not ideal because we are missing an error boundary uh we're going to fix this details in the last chapters right
[08:38:59] obviously it's not ideal that this types of errors shown even though this wouldn't show in production this is what
[08:39:05] you would see in production which is not any better but we will I'm going to show you how to add proper error boundaries i
[08:39:11] just wanted to show you that you can't fool this system we just created right you will either get redirected or you
[08:39:18] will be hit with a bunch of errors because you don't belong on that website amazing amazing job i think that
[08:39:26] officially marks the end of this chapter so now let's go ahead and let's open a pull request so 16 authentication
[08:39:34] i'm going to create a new branch 16 authentication
[08:39:40] i'm going to stage all of my changes 16 authentication i'm going to commit and
[08:39:46] I'm going to publish the branch now let's go ahead and open a pull request and let's review our changes
[08:39:58] and here we have the summary we added user authentication and theming support using clerk including sign in and sign
[08:40:05] up pages with theme aare styling we introduced a navigation bar with authentication controls and user display
[08:40:13] we added a user control component for displaying user information and actions we integrated authentication checks into
[08:40:20] project and message features ensuring users can only access their own data we
[08:40:26] improved project and message lists to only display personalized content and enforce userbased access exactly what we
[08:40:35] did in this chapter as always file by file walk through here and a whole
[08:40:41] sequence diagram explaining how our new clerk provider and authentication TRPC
[08:40:46] procedures work and we did a very good job this time the only comment is in the
[08:40:52] migration SQL um we don't really care about this because we are in development phase and no other comments amazing
[08:41:00] amazing job let's go ahead and merge this pull request and once we've done that let's go ahead and go back to the
[08:41:05] main branch and let's click on synchronize changes and okay and in a
[08:41:11] few seconds you will see that 16 was just merged authentication
[08:41:16] that marks the end of this chapter amazing amazing job and see you in the next one
[08:41:24] in this chapter we're going to implement billing and the credit system into our project in order to do that we first
[08:41:31] have to enable billing in clerk we then have to create a pricing page after
[08:41:37] we've done those two we can start and add rate limiting or usage or credit
[08:41:43] system in our application this will include adding some new models to Prisma
[08:41:48] schema and creating the util for rate limiting after that we're going to have
[08:41:54] to create the usage component which will show to the user how many credits they have and finally we're going to have to
[08:42:00] update some procedures to actually call this util for rate limiting to trigger
[08:42:05] credit spend so let's start with enabling billing so this is the first
[08:42:11] time I'm using clerk billing it was announced recently and the moment I
[08:42:17] heard it I just knew it had to be an incredible developer experience and I
[08:42:23] think that you will be shocked at how good it is because we all know that Clerk's developer experience is
[08:42:29] immaculate they have completely solved the issue of uh complicated code
[08:42:34] everything regarding Clerk is super easy super fast and super simple to do and
[08:42:40] billing is one of the most complicated parts of building the authentication especially if we are doing it with
[08:42:47] Stripe so you're going to be so impressed by the fact that we won't even
[08:42:53] need a web hook for this entire process more so we won't even have to build a
[08:42:59] single component besides our custom usage component which actually has nothing to do with billing let's go
[08:43:07] ahead and do that you can find information about clerk billing in their documentation here you can scroll and
[08:43:14] find billing and in here you can select B2C you can also do B2B but in this case
[08:43:19] it will be uh B2C SAS the first thing we have to do is enable billing so we have
[08:43:26] to go to billing settings this will redirect you to your project so you
[08:43:31] click into configure and down here billing settings go ahead and click create a plan and the
[08:43:39] first thing we're going to do is we're going to create a free plan so I'm going to go ahead and open this and in here
[08:43:45] you can set the name of the plan and you can set the slug like this so this is
[08:43:51] what we are going to use in our codebase to check if the user is on that plan right so we're going to check if free
[08:43:58] user is active that means the user is currently on the free tier uh and in
[08:44:03] here make sure to check publicly available this basically means that this will appear on the pricing table so you
[08:44:12] can create that and then you can click add another user plan and for example call this pro like this and give it a
[08:44:20] monthly fee of $29 and if you're wondering can I easily combine this into
[08:44:26] an annual discount yes you can just enable annual discount and in here set
[08:44:31] it to something like 25 so if they pay monthly it's going to be $29 a month but
[08:44:39] if they choose to pay annually we're going to reduce the price to $25 per
[08:44:45] month so you're going to get $300 instantly from them and in return
[08:44:51] they're going to have a bit of a cheaper plan you can of course uh assign the price to whatever you want and click
[08:44:58] save so right now in your subscription plans whoops right here you should have two
[08:45:05] subscription plans one free and one pro which is build monthly or annually so in
[08:45:11] here let me just go and click on the settings here and in here let's just click enable billing there we go so now
[08:45:18] billing is enabled and in here you can choose your payment getaway so if you want to you can add your own Stripe
[08:45:25] account but you can also choose clerk's payment getaway which is a zero conflict payment getaway it is ready to process
[08:45:32] and test payments immediately and this is amazing you're going to see how simple this is so to recap go inside of
[08:45:41] configure go inside of billing settings and make sure that you click enable make sure that you have a message billing is
[08:45:47] enabled after that go ahead and create two subscription plans right here and
[08:45:53] now let's go ahead and let's add a pricing table to our app
[08:45:58] so as always make sure that you are on your main branch
[08:46:04] make sure that you synchronize your changes and if you want to go inside of source control and confirm that the last
[08:46:10] change was adding authentication what we have to do now is we have to
[08:46:15] implement the pricing page so let's go inside of source app home and let's
[08:46:20] create a new folder called pricing inside page.tsx tsx
[08:46:28] like this let's mark this as use client and then let's go ahead and let's import
[08:46:35] image from next image and let's import pricing table from clerk next.js
[08:46:44] and let's go ahead and export this page so I'm going to export it like this and
[08:46:50] inside of here for now let's just do pricing table let's just do that and nothing more if you now go into your app
[08:46:58] just make sure you have it running and if you go to forward slashpricing
[08:47:06] uh it will redirect you to the login page so let's just make sure to add that here so forward slpricing
[08:47:15] like so now you should be able to go to localhost 3000 pricing
[08:47:22] there we go we have a date a pricing table so we didn't have to code a single
[08:47:28] component all we have to do is style it a little bit now so let's go ahead and do that so I'm going to go back inside
[08:47:34] of here and I'm going to add a class name flex
[08:47:40] flex column maximum width of 3 Excel MX auto and full width i will then add a
[08:47:48] section around our pricing table and I'm going to create a div inside of here
[08:47:54] with an image component and then in here I will add an H1
[08:47:59] element and then I'm going to add a paragraph now let's go ahead and style this starting with the section which
[08:48:05] will have space Y 6 padding top of 16 VH
[08:48:14] on to Excel padding top of 48
[08:48:20] then on this div encapsulating the image let's give it a class name of flex flex
[08:48:26] column and items center for the image itself give it a source logo SVG alt
[08:48:36] vibe width 50 and height 50 as well and
[08:48:43] give it a class name hidden MD block then in the H1 go ahead and add the text
[08:48:50] pricing and give this a class name of text extra large like this
[08:48:57] on MD text 3 Excel font bold and text
[08:49:02] center for the paragraph enter the text choose the plan that fits your needs
[08:49:10] and give this a class name text muted foreground text center text small and MD
[08:49:19] text base and now let's just go to the pricing
[08:49:25] table appearance and let's add elements here pricing
[08:49:31] table card and let's change this to use the border shadow none
[08:49:38] rounded large just just make sure you're putting the exclamation points here and
[08:49:43] just like that we have a pricing table that clearly reflects the two plans that we created in clerk dashboard so now
[08:49:52] let's go ahead and let's modify the descriptions of these and let's show some features which will be active once
[08:49:59] we upgrade so let's go inside of our clerk
[08:50:04] dashboard here go inside of configure and in here subscription plans select
[08:50:10] the free one and let's go ahead and give it a description for getting started
[08:50:16] like this and click save and then in here let's add a feature and
[08:50:22] let's go ahead and call this feature five monthly credits
[08:50:29] like that make sure it's publicly available and let's click create feature and let's click save and just by doing
[08:50:36] that and refreshing you will immediately see the new description reflected here and you will also see the new feature
[08:50:43] five monthly credits and now if you wanted to this is where you will add
[08:50:48] even more features for example public projects something like that so for
[08:50:54] example we don't even have private or public projects all projects are private in our case but for example here you can
[08:51:02] see how that would look like and now let's go ahead and let's modify the other plan which is the pro plan so go
[08:51:11] back here back inside of our subscription plans and select the pro plan so this one can
[08:51:20] have the description of for more projects and usage
[08:51:25] and then go inside of the features here and let's go ahead and add a new feature
[08:51:32] called 100 credits per month like this
[08:51:39] let's go ahead and let's add private projects
[08:51:44] like that let's add custom domains basically whatever you plan to you know
[08:51:50] extend this application with you can add here or maybe some collaboration like three editors per project all right just
[08:51:58] think of a bunch of features you would add to your app and let's do uh remove
[08:52:04] the vibe badge imagine that we would create some kind of feature that adds the vibe badge and click save and you
[08:52:12] can of course you know drag and drop this however you like i just wanted us to add a lot of features here simply
[08:52:18] because the the pricing table looks better if you add more features here and
[08:52:23] I absolutely love how this looks so now that we have uh this finished let me
[08:52:31] just go ahead and do one thing i want to go inside of layout right here and I want
[08:52:39] to modify the clerk provider and its appearance here and I want to add variables here color primary and I'm
[08:52:47] just going to set it to the light mode of our cloud theme which is this
[08:52:54] and when you save this you can see that immediately it will pick up the theme that we are using throughout the project
[08:53:01] and I just think this looks amazing now let's just go back to the pricing here
[08:53:07] and let's enable dark mode if we need it so I'm going to import
[08:53:15] dark from Clark themes and I'm going to import use current theme make sure this is
[08:53:21] marked as use client go ahead and add this and then simply in the appearance
[08:53:29] go ahead and add base theme checking if the current theme is dark then use dark
[08:53:34] otherwise it's undefined and now this page will support dark mode as well uh
[08:53:39] and if you try and subscribe you can see that you're redirected to login so you don't have to immediately uh try and
[08:53:46] subscribe simply because I want to demonstrate the entire upgrade process you can see that when I log in by
[08:53:52] default every user is in the free tier you didn't even have to write the code for that you automatically we
[08:53:59] automatically added this user to the free tier if you click subscribe here you can see how nicely this looks as I
[08:54:05] said you don't have to do this now if you can fine sure but you're going to have to create a new account to test out
[08:54:12] our usage uh tryyouts so you can see how this looks i think it's just you know
[08:54:18] amazing uh and one thing that I want to fix that we forgot about is when I
[08:54:24] scroll I want this navbar to stop being transparent because it just looks weird
[08:54:31] so let's quickly fix that by going inside of source hooks and let's create
[08:54:36] use scroll.ts like this
[08:54:42] and inside of here let's go ahead and do import use state use effect from React
[08:54:49] export const use scroll and let's add the threshold
[08:54:57] to be 10 define the state is scrolled and set is
[08:55:02] scrolled use state by default is going to be false call use effect
[08:55:10] with for now an empty dependency array
[08:55:15] like this and inside create a handle scroll arrow function
[08:55:23] which will call set is scrolled to be window scroll Y which is above the
[08:55:31] threshold and then let's add a window add event
[08:55:36] listener here to listen for scroll and handle scroll
[08:55:44] and then simply call handle scroll and in the return method call window remove
[08:55:49] event listener scroll handle scroll just
[08:55:54] like that and add the threshold inside and all you have to do is return is
[08:56:01] scrolled there we go so now that we have use scroll in our app we can go back to the
[08:56:09] navbar inside of home module UI components navbar and in here you can
[08:56:15] now easily get is scrolled use is scrolled
[08:56:21] use scroll my apologies from hooks use scroll and then make this a dynamic
[08:56:28] class name by wrapping it inside of curly brackets and adding the CN util so
[08:56:34] we have to import CN from lib utils
[08:56:39] i'm going to keep the static classes as the first argument and then I'm going to check if is scrolled let's do back bg
[08:56:47] background and border border so now if you scroll ever so slightly
[08:56:54] you can see that the navbar starts to stop being transparent and a
[08:57:01] border appears amazing now that we have this and now that we have the billing
[08:57:07] let's go ahead and just check a couple of things so now this upgrade button should take you to the pricing if yours
[08:57:14] doesn't make sure you check the project view here and make sure that you have a
[08:57:20] button let me just find it here it is button with a link redirecting to
[08:57:27] pricing like that and now it's time to create the usage model so in order to do
[08:57:35] that we're going to have to install a package called rate liimiter flexible so
[08:57:44] let me just close this and this and let me do npm install rate limiter flexible
[08:57:52] like this let me show you the version
[08:57:57] so I'm using 7.1.1 that's my version let me do npm rundev and then in here
[08:58:06] I'm going to go ahead and do the following inside of Prisma schema
[08:58:11] I'm going to create uh a new model called usage right here at the bottom
[08:58:18] model usage let's go ahead and give it a key which
[08:58:25] will be a type of string and that's going to be the ID and then a points
[08:58:31] which will be integer and finally expire which will be an optional
[08:58:38] date time so this will be my usage model now let's go ahead and let's do npx
[08:58:45] prisma migrate dev we don't need to clear our database because this is not
[08:58:51] really conflicting with any other models we're just adding a new one so I'm going to call this migration usage
[08:59:00] let's go ahead and add the name usage and there we go
[08:59:06] now that we have the new usage model here and the new migration ready let's
[08:59:12] go ahead and let's implement uh the usage tracker so this is what I'm going
[08:59:18] to do i'm going to go ahead and create a new lib that I'm going to call usage.ts
[08:59:24] ts and inside of here I'm going to go ahead and add an import for the rate
[08:59:32] limiter so specifically it's going to be rate limiter Prisma right here and let's
[08:59:38] go ahead and do export async function get usage tracker
[08:59:45] like this and for now I'm just going to define const usage tracker to be new
[08:59:52] rate limiter Prisma store client will be our Prisma from the
[08:59:58] database like this
[09:00:04] and table name will be usage so just make sure it matches exactly the model
[09:00:09] we named here and for the points let's go ahead and by
[09:00:15] default uh give everyone five points
[09:00:20] and for the duration let's go ahead and let's do 30 days so 30 * 24 * 60 * 60
[09:00:29] now what I like to do is I like to do const free points and let's go ahead and
[09:00:36] give everyone free points so you can replace this like so then let's do the cons duration to be 30 * 24 * 60 * 60 so
[09:00:45] you can add a little comment 30 days for example
[09:00:52] and now that we have this let's just return the usage tracker
[09:01:01] and now let's go ahead and let's create a function called consume credits so export async function consume credits
[09:01:10] and in here let's go ahead first uh and let's extract user ID to be await out
[09:01:19] from clerk next.js server
[09:01:25] like so and make sure to execute this if there is no user ID we can throw new
[09:01:33] error here user not authenticated that's the first thing and then let's go
[09:01:40] ahead and do const usage tracker to be await usage tracker basically this
[09:01:46] function which we defined above and then in here const result to be await usage
[09:01:54] tracker dot consume pass in the user ID and then how many
[09:02:00] points do we want to take from them so for that I'm going to define const generation cost cost to be one so let's
[09:02:09] go ahead and add that here so we're going to subtract one point from the user every time we consume credits and
[09:02:17] then let's just return result and then let's create the last function
[09:02:24] export asynchronous function get usage
[09:02:30] status again extract user ID from await out
[09:02:37] if there is no user ID throw new error user not authenticated
[09:02:46] and then let's do const usage tracker here to be await get usage tracker
[09:02:55] and then result will be await usage tracker
[09:03:01] dot get user id so we are looking at how many points we have left
[09:03:07] there we go so we are basically using this very very cool library which can inject directly into Prisma uh and I'm
[09:03:14] just going to open the documentation now for it so you can read more so here it is node rate limiter flexible
[09:03:24] basically node limiter flexible counts and limits the number of actions by key and protects from DDOS and brute force
[09:03:30] attacks at any scale it works with W key radius prisma dynamo process memory
[09:03:35] cluster pm2 memach myql sqlite and posgress also works in the browser it
[09:03:42] offers atomic increments all operations are in memory or distributed environment use atomic increments against race
[09:03:50] conditions so if that's something you were wondering about yes we solved the problem of race conditions by using this
[09:03:55] package it is extremely fast it is flexible ready for growth and it is
[09:04:01] friendly now should it be used exactly the way I'm using it right i'm using it
[09:04:06] as a simple rate limiting for premium credits i haven't really seen any advice
[09:04:13] not to do it but since it solves uh a bunch of problems out of the box and
[09:04:18] it's just an npm package I thought it was a no-brainer to use it uh given the fact that we can easily add it to Prisma
[09:04:26] right so that's why I chose this package uh I explored a bit what we should use should we develop our own and this ended
[09:04:32] up being the best decision great so now that we have these three functions a
[09:04:38] functions to get the usage status by the current user ID key a function to
[09:04:43] consume credits for the current user and the overall function to get the usage
[09:04:49] tracker which right now doesn't make too much sense this could have been a constant but don't worry it will make
[09:04:55] sense later so now let's go ahead and let's actually create the procedure for
[09:05:02] the rate limiting here so I'm going to go ahead and go inside of source i will
[09:05:08] create a new module called usage and in here I'm going to
[09:05:13] create server and then I'm going to create procedures.ts
[09:05:20] let's go ahead and do get usage status from lib usage let's import create trpc
[09:05:26] router from trpc init and protected procedure
[09:05:32] then let's go ahead and export constage router to be create trpc router status
[09:05:40] is going to be protected procedure query asynchronous method
[09:05:47] and then in here let's open a try and catch block return null in the catch
[09:05:53] block and in the try attempt to get the result from await get usage status and
[09:05:59] return the As simple as that so we we don't really
[09:06:05] worry about catching these errors and displaying something since this is a query right so once you've done this go
[09:06:13] ahead and add that to your TRPC routers here so usage usage router
[09:06:21] there we go and yes if you want to you can move everything usage related into this
[09:06:27] module perhaps you can move it out of the usage um
[09:06:33] for now I will leave it here but yeah if you want to you can create a lib here i think it will make more sense actually
[09:06:39] uh okay now that we have this let's go ahead and let's create the usage
[09:06:44] component so this one will be interesting let's go inside of source
[09:06:50] modules projects UI components and let's create usage.tsx
[09:06:57] so in here I want to create an interface props which accepts the points and milliseconds before next refresh
[09:07:04] and for the imports let's go ahead and let's import link from next link let's
[09:07:11] go ahead and let's import the crown icon from lucid react and let's import format
[09:07:18] duration and interval to duration from date fns and finally the button from
[09:07:24] components UI button now in here let's go ahead and let's add the usage like so
[09:07:32] let's return a div with a class name rounded top extra large bg background
[09:07:40] border border bottom zero adding 2.5
[09:07:46] another div inside with a class name flex items center and gap x of two
[09:07:56] in here a div which will have one more div inside and this inner deal div div
[09:08:02] will have a class name of text small and let's go ahead and simply render the
[09:08:08] number of points that we have and then let's just say you have that many free credits remaining and you can change
[09:08:16] this into a paragraph so we don't use so many divs and then after that add
[09:08:22] another paragraph with a class name of text extra small
[09:08:27] and text muted foreground and inside resets
[09:08:34] in then add a space like this open curly brackets format duration
[09:08:43] inside of it interval to duration
[09:08:48] and set the start to be new date and set the end to be new date and inside date
[09:08:56] dot now plus milliseconds before next
[09:09:02] and then add a new prop here I mean a new param in this interval to duration
[09:09:09] uh my apologies format duration function which takes the format to be months days
[09:09:17] and hours so it's going to display in those intervals and I think that's it i think that's all
[09:09:25] we need and then outside of this div right here
[09:09:33] go ahead and add a button and a link inside the link will have an href to the
[09:09:40] pricing page we're going to render a crown icon and text upgrade the button
[09:09:47] will have an as child size small variant will be the new one that we created
[09:09:53] tertiary I I guess class name ML auto
[09:09:59] now that we have this let's go ahead and display the usage prop
[09:10:06] in order to display it we have to go inside of our messages form
[09:10:13] component so it is inside of projects UI components message form and then let's
[09:10:20] go ahead above this and let's do show usage and end and then render the usage
[09:10:27] like so import the usage from dot / usage passing the points to be zero and
[09:10:33] milliseconds before next to be zero just make sure you have imported the usage
[09:10:39] component so now go into any random project that
[09:10:45] you have so I'm going to go ahead and go inside of this one that I already have
[09:10:50] and once this loads nothing changes but if I go inside of the message form and
[09:10:56] if I change the show usage to true
[09:11:01] and if I refresh you will see zero free credits remaining resets in nothing and
[09:11:07] we have a button to upgrade that's what I wanted to see and now what we're going
[09:11:13] to do is we're actually going to fetch the usage from our new router so let's go ahead to the top here and
[09:11:21] before the form let's do const data usage to be use query which you can
[09:11:29] import from let me just find tanstack react query
[09:11:34] here it is and in here pass TRPC usage status like
[09:11:42] this query options and once you have the usage let's go
[09:11:48] ahead and define the show usage to be double exclamation point and then usage
[09:11:55] and then in here you're going to do if you pass the points to be usage remaining points and in here usage
[09:12:03] milliseconds before next and now let's refresh
[09:12:09] and it looks like it does not exist yet i think that is because yes so it's not
[09:12:16] going to exist right now because in order for this to be written to the database let me just start npx Prisma
[09:12:24] studio so you can see what I'm talking about we have this new model called usage right now we have the fields key
[09:12:33] points and expire but nothing exists here it will not be created by itself it
[09:12:38] will be created after the very first consume credits function
[09:12:44] is called so the first time we do dot consume and take some points that's when
[09:12:49] it's going to be stored in the database so let's go ahead and let's do that so
[09:12:55] the first one we can do it for is the messages procedures so let's go inside of messages server procedures and in the
[09:13:03] create here let's go ahead and do that so before we even create the message
[09:13:10] here let's go ahead and let's do await and
[09:13:16] let's call consume credits like so and now this will already work
[09:13:24] but I want to do I want to just wrap this into try and catch because get
[09:13:30] usage uh usage.conume will have an error object right because
[09:13:37] there is an error that we have to catch and that is the error which says you have no more points so we have to catch
[09:13:44] that here so let's do it by wrapping this inside of try
[09:13:51] like so and then open catch and let's get the error and the first thing we're
[09:13:56] going to do is we're going to check if error is actually an instance of error
[09:14:01] this is this basically means that something else happened right this
[09:14:06] doesn't mean that we hit a rate limit this just means something literally
[09:14:12] failed maybe it's the database connection right because this works by connecting to the database so maybe that
[09:14:17] failed so it would be incorrect to just throw a TRPC error saying rate limit exceeded if consume credits fail that's
[09:14:24] why in here I will throw new ERPC error here with the code
[09:14:33] bad request and a message something went wrong right so I have no idea what
[09:14:41] happened here but it's not something we expect otherwise it is so if it is not an
[09:14:48] instance of error that means this is the rate limit response so in here add a
[09:14:55] code too many requests and add a message um let's see you have no more or maybe
[09:15:03] you have run out of credits something like that basically a message
[09:15:09] indicating to the user that they have no more points and now just for fun I'm
[09:15:14] going to modify my usage here and I'm going to set uh two free points
[09:15:20] so let's go ahead and try it out now I'm going to do build a landing page
[09:15:26] something that reliably works for me and we should have done uh one thing here immediately oh yes we forgot the ingest
[09:15:34] API we forgot to do that npx inest cli
[09:15:39] whoops my bad and let me just refresh this and you can see that now when you
[09:15:45] refresh you you have one free credit remaining which resets in 29 days and 23
[09:15:50] hours do I have my Prisma Studio running i do so if I go here now in the usage
[09:15:56] and reset once we call this consume method you can see that I have a key
[09:16:02] which is the user ID with some prefix here and I can see when this will expire
[09:16:07] and I can also see how many points I have spent so far so I only spent one point so far and basically that is how
[09:16:15] this is going to work so just for fun I will do build a landing page again and
[09:16:20] this time uh I will refresh and I will have no free credits remaining so if I
[09:16:26] try one more time I should get the error you have run out of credits and we just got that error amazing you successfully
[09:16:33] implemented usage now you probably noticed a little bit of a weird thing
[09:16:38] here uh and that is that uh we call consume credits
[09:16:44] before we even know that this succeeded
[09:16:50] so if you want to you could move this consume credits function into the
[09:16:56] background job and then only consume the credit after you successfully save the
[09:17:01] result to the database it will depend on what you want to protect right if you
[09:17:06] want to protect your resources you will most likely add this before you even call uh something like inest and you
[09:17:15] don't even want to spend any open AI credits if someone doesn't have enough credits right but if you were to pass
[09:17:22] this in the background job you would also need to pass the user ID in the event data so just be mindful of that
[09:17:29] and then you would also have to modify the consume credits overall because in here we rely on it using ALF and I'm not
[09:17:36] sure how this will work if it is invoked from a background job i just think that it will throw user not authenticated
[09:17:43] because background jobs by default are not authenticated they are like web hooks right so that's why I decided to
[09:17:51] do it in the procedure rather than in the background job what we have to do is
[09:17:57] this to-do right here so let's remove this let's add queryclient dot invalidate queriesc
[09:18:04] usage status query options like this so now when we create a new message we
[09:18:11] automatically invalidate the queries and one easy way to reset this is to just go
[09:18:16] inside of your Prisma Studio and just bring back the points for your user to
[09:18:22] be zero and click save and this way you will not have spent any points so you
[09:18:27] are now back at three credits remaining so if I go ahead and do test and send
[09:18:33] the message now it should automatically upgrade and there we go you can see now it says one so that is thanks to this
[09:18:39] invalidation here and now we can also fix this to-do here as well so if error.code
[09:18:46] error data question mark code is equal to too many requests let's go ahead and
[09:18:53] do router we don't have router so let's add it con router
[09:18:59] use router from next navigation make sure you add this import
[09:19:06] and just do router.push push forward slash pricricing like that so now when
[09:19:12] you hit too many requests it will yeah you can see this is kind of the not
[09:19:17] perfect thing if you spend your credit on a bad query we take the credit away
[09:19:23] from you and you don't get the result so yeah not exactly perfect but I think
[09:19:29] it's pretty good so far right let's go ahead and just I purposely just going to use stupid queries now just to get that
[09:19:36] error there we go so once I run out of credits I'm redirected to the pricing page perfect now there is one more place
[09:19:43] where we need to do this exact thing so I'm going to go inside of messages procedures just so I can copy the try
[09:19:51] and catch for my consume credits here and now let's go ahead and go inside of
[09:19:57] projects server procedures procedures right here and find the
[09:20:06] create right here and simply call that try catch before you create a new
[09:20:15] project and import consume credits like this and then go inside of project
[09:20:23] form component and we have to do the same thing
[09:20:28] so first things first query client invalidate queries and pass in gRPC usage status
[09:20:36] query options and then in here
[09:20:42] if error data code is too many requests do router.push/pricing
[09:20:50] there we go so now you have the exact same thing happening from here so if you try test from here same thing happens
[09:20:57] you have run out of credits and you are redirected here amazing but right now if
[09:21:03] we were to upgrade nothing would change so let's go ahead and fix that so in
[09:21:08] order to fix that we have to go inside of our usage in the lib here and then
[09:21:15] what we have to do uh is we have to get
[09:21:20] inside of here the status so has and let's do await out
[09:21:27] hon has premium access will be has plan
[09:21:34] and then pro so how do I know it's pro well because inside of the clerk
[09:21:39] configuration here the slug is pro so maybe has row axis would be better and
[09:21:47] then what I'm going to do is I'm just going to add const pro points 100 like
[09:21:53] this and then if I have has proaxis it's going to be row points otherwise it's
[09:22:01] going to be three points like that and here's a
[09:22:06] quick tip if you also want to change the duration uh which I wouldn't recommend
[09:22:12] you know there there's also if you look at all of these apps chat GPT uh claude
[09:22:18] lovable bolt replet I've noticed that not all of them have annual plans and
[09:22:23] the reason for that is it is safer for them to bill you monthly uh simply
[09:22:29] because they don't know how many credits you can spend right so that's why I recommend not changing the duration for
[09:22:36] the proaxis but even if you wanted to the way this rate limiter works is that it will not update the duration right so
[09:22:44] you can update the points in the middle of an existing uh database record for
[09:22:50] rate limit but you cannot do it for expiration just if you in case you were interested but in this case it doesn't
[09:22:56] really matter because it is safer for us business-wise to track monthly usage and
[09:23:02] do monthly billing right even if a user is on an annual plan we're just going to give them the same amount of points 100
[09:23:09] points per month great now that we have this done uh let
[09:23:15] me just check i think this is the only place here uh where I have to do that
[09:23:20] and now let's just do a comparison so when I click on one of my projects it says zero
[09:23:26] free credits remaining i will click upgrade i will click subscribe pay with the card
[09:23:33] that's it that was clerk billing i don't know if you just saw that but that was it i can now go inside of my manage
[09:23:40] account billing and I can find that I am on this plan and from here I can see
[09:23:46] cancel subscription i can switch i can remove monthly whatever I want so I
[09:23:52] think this is insanely good and let's see if it worked so right now uh I think
[09:23:58] that there we go i have to refresh right and then it says 96 free credits
[09:24:04] remaining so we are have officially upgraded right i can now send another broken message and it works so we
[09:24:12] successfully added 100 points it seems like it has subtracted the existing
[09:24:17] points we spent during the free trial so that's something we could improve but overall it works when the user is pro we
[09:24:26] use a larger amount of points here so now what we have to do is we have to
[09:24:34] change the text this is no longer free credits this is just credits now and we can also remove all of the upgrade
[09:24:40] buttons we no longer need them so let's do that i'm going to go inside of the usage.tsx
[09:24:48] here and let's see so this is from out which means that in here we can access
[09:24:53] has from use out from clerk next.js js
[09:24:59] I have has here so I'm going to change let's go ahead and do const is has pro
[09:25:06] access has plan pro
[09:25:13] has question mark plan pro so let's check if has pro access then it's an
[09:25:20] empty string otherwise it is free so now it should just say 95 credits remaining
[09:25:27] no free credits and let's hide this button if I don't have Pro Access
[09:25:37] so only show this for users who don't have Pro Access there we go and let's do
[09:25:43] the same thing in the project view so I'm just going to copy this go inside of the project view
[09:25:51] i'm going to add it here i'm going to import use out from clerk
[09:25:58] nextjs i'm going to move it here and then if I don't have pro access I'm
[09:26:06] going to show this button right here so if I don't have pro access only then
[09:26:15] show the button and there we go now the button doesn't exist if you want to use the reverse
[09:26:22] logic if you want to create const is free tier then you would do has plan and
[09:26:31] be careful here it's not free right you always have to go inside of here inside
[09:26:37] of your plans select the plan you want and then check the slug it's free user
[09:26:44] this is the one you want that's the mistake I made when I developed so I'm just warning you but in here we used
[09:26:51] this type of logic so it's fine and I think that that might be it regarding
[09:26:57] billing it was that simple to do i'm super impressed by this no web hooks
[09:27:03] nothing i mean 90% of this chapter wasn't even adding billing it was adding
[09:27:08] usage rate limiting right so amazing amazing job i am super satisfied by this
[09:27:16] so let's go ahead and merge all of this i believe this chapter is called 17 billing and let's just mark things so we
[09:27:22] enabled billing created pricing page added rate limiting updated the Prisma schema created the util we created the
[09:27:29] usage component and we updated procedures to trigger credit spend yeah one more thing I wanted to show you if
[09:27:36] you want to you can also implement something like usage procedure and then in the middleware you could check for
[09:27:43] the uh consume status maybe that would be something fun for you to try and then
[09:27:49] you would have a more abstracted routers and procedures to work with maybe
[09:27:55] homework for you if you want to after you finish the project okay so I'm going to go ahead and I will
[09:28:02] create a new branch here 17 billing like this i'm going to stage
[09:28:11] all of my changes i'm going to add 17 billing commit here and I'm going to
[09:28:16] publish the branch just a quick reminder there's a code rabbit free extension
[09:28:21] which you can use and it will review all of your files for you
[09:28:27] now let's go ahead and let's open a pull request here and let's see the summary
[09:28:32] of our billing changes and here we have the summary we
[09:28:38] introduced a usage and credit tracking system for users with separate limits for free and pro plans we added a new
[09:28:45] pricing page with dynamic theming and a detailed pricing table we added a usage
[09:28:50] component to display remaining credits and reset time with an upgrade prompt for nonpro users navbar now dynamically
[09:28:58] changes style based on the scroll position as per the enhancements project
[09:29:04] and message creation now deducts credits and prevents actions if credits are exhausted redirecting users to the
[09:29:10] pricing page when necessary usage status is now displayed and updated in relevant forms and components the upgrade button
[09:29:18] is only shown to users without a pro plan perfect so that's exactly what we
[09:29:24] did as always an more in-depth walkthrough here and we have a sequence diagram uh explaining exactly what
[09:29:31] happens right so when user tries to submit a and create a new project or a
[09:29:36] message we call the mutation in here we call the consume credits and in here we call the database to check and update
[09:29:43] the usage and then if we have credits available we return with succeed with
[09:29:49] success and we proceed with the creation and then we simply return the creation results but if credits are exhausted we
[09:29:56] throw too many requests and we redirect the user to pricing amazing exactly what
[09:30:02] we developed and in here we also have the diagram for our get usage status
[09:30:08] method which simply reads the usage and it returns it perfect so in here we have
[09:30:14] some actionable comments this one recommends adding a default false in
[09:30:19] case has doesn't load which is actually a good advice we could do that
[09:30:25] in here it recommends wrapping this instead of try and catch
[09:30:31] and fall backs to soon so this can happen if the dates are
[09:30:36] incorrect and yeah this this might be a good idea because it's kind of u weird
[09:30:42] that the entire page fails just because the date renders incorrectly so we could
[09:30:49] actually do this in the next chapter uh so we ensure some kind of security here
[09:30:55] so it doesn't ruin the entire experience and then in the usage.ts for all of the
[09:31:00] function it recommends adding error tracking but we don't have to do that simply because we track in the TRPC
[09:31:07] so I'm going to merge this pull request i'm going to keep in mind the changes it suggested and then I'm going to change
[09:31:13] back to my main branch here and I'm going to click on the synchronize changes button and okay and then I will
[09:31:20] confirm that we just merged that right here 17 billing perfect amazing amazing
[09:31:27] job we have finished billing and see you in the next chapter
[09:31:34] in this chapter we're going to implement agent memory right now our agent and our
[09:31:40] conversations have no context the agent doesn't know the history of our
[09:31:46] conversations it doesn't understand our previous messages each message is
[09:31:52] technically a new project let's test that out as always ensure that you are
[09:31:58] on your main branch and feel free to synchronize the changes the last chapter was 17 billing make sure you have npm
[09:32:07] rundev and injust running and what I want you to do is I want you to create a very simple build a landing page the one
[09:32:16] we already did hundreds of times so go ahead and build a simple landing page
[09:32:24] and here we have a very simple landing page what if I just send it a message
[09:32:29] make it red what we would expect to happen is that
[09:32:34] it would understand that my previous message was build a landing page and it
[09:32:39] will now change it to red but the truth is that won't happen right so it didn't
[09:32:47] modify the landing page it's simply updated the page to be a red themed page
[09:32:54] if I add add a calculator there it won't understand what I mean right but what we
[09:33:02] want to is basically a landing page like this colored in red or if I tell it build a
[09:33:10] calculator in the hero segment I want a little calculator here instead of the
[09:33:16] rocket so let's go ahead and make that possible the reason we really really
[09:33:21] need this is not for continuous conversation the more important reason is AI can make mistakes you already saw
[09:33:28] that sometimes it forgot to add use client and we want to allow our users to say "Hey you made a mistake you forgot
[09:33:36] use client." Because if I just give it that right now it will have no idea what
[09:33:42] I'm talking about it has no idea that previously it created this so let's
[09:33:48] improve that let's fix that what we're going to do is the following we're going to go inside of our functions.ts
[09:33:58] and in here let's go right after we do sandbox ID and let's do const
[09:34:09] messages and let's do await step.r run
[09:34:15] get previous messages it is an asynchronous arrow function like this
[09:34:22] and then let's do con formatted messages and give it a type of message which you
[09:34:30] can import from inest agent kit so I can put type message here as well
[09:34:37] and set it to be an empty array and now let's fetch the messages using await
[09:34:43] prisma messages and let's do find many
[09:34:49] where project id is event data project
[09:34:54] id like that and let's add order by
[09:34:59] created at descending and then for con message of messages
[09:35:08] let's go ahead and push each message to this new array the reason we are doing it like this is so that we have this
[09:35:15] type which cannot be uh broken so formatted messages
[09:35:22] dot push type text ro if message ro is assistant it will be
[09:35:32] lowerase assistant otherwise lowerase user like this and the content is going
[09:35:39] to be message dot content and let me just see what uh what is the problem
[09:35:47] here formatted messages oh it should be an array of message my my apologies
[09:35:54] there we go and then let's go ahead and let's return formatted
[09:36:01] messages there we go so right now it it is going to have context of the entire
[09:36:07] conversation and it will know exactly what we told it it will know exactly what it responded back to us so now
[09:36:13] let's go ahead and let's create a const state to be create state from agent kit
[09:36:20] again so create state from inest agent kit
[09:36:25] let's give it a type of agent state so we already have agent state defined
[09:36:31] right here we have summary and files and let's go ahead and do the following
[09:36:37] the first object in here will be summary make it empty and files make them empty
[09:36:44] and then in the second object you will have messages which will be previous messages
[09:36:51] and now we have the state so now we have to add this state uh to a couple of
[09:36:57] places so let's go ahead and find our network execution right here and let's add default state
[09:37:05] to be the state from above and in the result when we run it let's add state
[09:37:13] and make it state or you can use the shorthand operator like this perfect so
[09:37:18] let's go ahead and do this again build a landing page let's do that build a
[09:37:25] landing page and let's follow the context here as you can see we now have a step get previous messages and you can
[09:37:32] now see that we included all of the new all of the older messages even the
[09:37:38] responses and the user messages here so now the code agent as you can see has
[09:37:44] messages so it knows exactly what we ask it to do now so let's go ahead and wait
[09:37:51] for this result right here we should see it any second and you can
[09:37:58] see how it preserved the red color because that's what we asked previously so it already knows the context and now
[09:38:05] this is what I'm going to say add a calculator in the hero segment
[09:38:12] so I didn't tell it to create a landing page i didn't tell it anything other
[09:38:18] than this and let's see how well it will do of course it can make a mistake even at
[09:38:23] this point but now it has the context it knows that add a calculator in the hero
[09:38:29] segment is the message after build a landing page and it is a message after
[09:38:35] uh created a polished fully responsive red themed landing page so let's see if
[09:38:41] it was able to do this or not we should see any second now uh and
[09:38:48] looks like it wasn't able to do it let me refresh just in case
[09:38:53] and let's see the code looks like we didn't add it so
[09:39:00] let I just want to make sure that I didn't accidentally maybe do the incorrect order
[09:39:06] of loading the messages here created at descending i think that
[09:39:13] should be okay let's try again you didn't add the calculator component in
[09:39:20] the hero page add the calculator component
[09:39:26] so in the previous examp when I tried this privately off camera it worked for
[09:39:32] me so you can see that AI is sometimes a bit unpredictable but I just want to tune it you know uh we might even have
[09:39:40] to modify the prompt for this we might have to tell it you have context of all
[09:39:45] older messages you can use older messages right but you can already see a
[09:39:51] slight improvement right because right now when we asked it to create that landing page uh it's it made it red
[09:39:58] right so it understood the context but I have a feeling it is still not
[09:40:03] understanding entirely what we want let's see if this will be better and there we go we now have a very very
[09:40:08] simple calculator in our landing page
[09:40:13] great so this is exactly what we asked let's try and do make it green now just
[09:40:20] to make sure that this is the last message it sees right i want I'm okay
[09:40:25] with adding state i just don't want to make it so that it conf it's confused
[09:40:31] about what is the latest message so let's follow along in the running here
[09:40:36] so yes make it green is the first message in the array here maybe that should be the opposite i don't know
[09:40:45] because maybe it's now thinking that this the last message in the array is the newest one and let's see the coding
[09:40:53] agent i think the coding agent understands the same thing maybe or not
[09:41:00] yeah in here it also the last message here is build a landing page so I keep thinking that maybe
[09:41:07] or maybe not yeah you can see that it preserved the fact that it's a landing page it added the calculator and it ma
[09:41:14] changed it green so obviously now it understands what we are doing so I'm going to go ahead and add a little to-do
[09:41:21] here to-do change to ascending if AI does not
[09:41:30] understand what is the latest message
[09:41:36] but I think that it works pretty well i think that it understands that make it green refers to the landing page which I
[09:41:44] scolded it for because it didn't add the calculator so now it has both the calculator and it is green and I think
[09:41:50] that's exactly what we wanted so let's try and just do one more time make sure
[09:41:56] to use separate component files
[09:42:02] and while this is happening uh let's go ahead and do the following i want you to
[09:42:07] visit my uh public assets folder or the source code you can use the link in the
[09:42:13] description or the link you can see on the screen and in here I added a new file called additional prompts and in
[09:42:19] here I have the response prompt and the fragment title prompt so go ahead and copy this entire file go inside of your
[09:42:26] prompt.ts and at the end of it or if it's easier you know at the top just add those two
[09:42:33] and export both of them so export the fragment title and export the response
[09:42:38] prompt we're now going to use this to create two more agents so they create better responses
[09:42:46] and so they create a proper name here so let's see what it did there we go so it
[09:42:51] understood the context it it seems to again made it red uh I keep thinking
[09:42:56] that the way we are loading these previous messages maybe isn't perfect so you're going to have to tweak that a
[09:43:03] little bit or maybe you can somehow um
[09:43:08] maybe you can somehow modify it so that it knows you can add it in the content like maybe let's see
[09:43:16] I'm thinking of keeping a track of the index and then maybe we can modify the content and like say first message and
[09:43:23] then the message content like something like that and then maybe
[09:43:30] In here we can keep track of index and then replace this with the index for example maybe that can instruct it
[09:43:36] better to understand what's going on but uh what's important is that it at least
[09:43:41] understands the last message right that's what I want to make sure so I just told it to use separate components
[09:43:48] and that's exactly what it did it preserved the fact that it's a landing page but it made it uh into separate
[09:43:55] components let's do make it green or let's do make it yellow this time you
[09:44:00] know keep testing it make sure that it's listening to you and you can play around with changing the order here you can use
[09:44:07] that idea that I told you uh you can even explore you know in justest documentation about the state maybe in
[09:44:13] there we can find something uh I will of course research off camera and in the next chapter I will tell you more
[09:44:19] information if I find out anything new but what I want to do now is the following
[09:44:26] in the function here after the network finishes so right here after we get the
[09:44:31] result I want to go ahead and I want to do uh the following so I want to create
[09:44:40] an agent called fragment title generator and that will be create
[09:44:48] agent like this and let me just see I already
[09:44:53] forgot how do we create agents so the name will be something and then
[09:44:59] the description and then the system and then model okay so I will just copy this
[09:45:04] let's add it all over here so the name will be fragment title generator
[09:45:11] a description will be a fragment title
[09:45:16] generator and for the model we can use open AI and you can use a cheaper model you can use
[09:45:22] 4.0 for example and you can remove the default parameters here so in here use a cheaper model because this will just
[09:45:28] generate text and in here go ahead and use the fragment title prompt which we
[09:45:34] just added and also now import the response prompt
[09:45:40] so let's go ahead and use this now after this go ahead and copy it and now this
[09:45:46] will be response generator change this to be response generator and
[09:45:54] a response generator and change the system here uh to be
[09:46:01] response prompt and now you're going to define two outputs the first output here
[09:46:08] will be t uh fragment title await
[09:46:13] fragment title generator run and inside of here you will pass the
[09:46:21] result state data summary and then you're going to copy this and
[09:46:26] this will be response response generator from the same thing
[09:46:32] and then you're going to go inside of save result
[09:46:38] and for the fragment title go ahead and do the following fragment title dot uh
[09:46:45] first in the array dot type is equal to text fragment title first in the array
[09:46:52] dot content otherwise just fragment like this and let me just see content is
[09:47:00] this um okay let me just build a little function
[09:47:06] uh so we don't have to do this in one file so we have fragment title
[09:47:13] output and we have response output here so I'm going to just collapse this
[09:47:24] and then in here I'm going to do con generate fragment title
[09:47:30] and I will do if fragment title output type is not
[09:47:38] equal first in the array of course the text return fragment ment
[09:47:48] otherwise let's go ahead and do if fragment title generator first in the array
[09:47:54] content and let's check maybe if is array
[09:48:02] can I do this uh array is array I think
[09:48:11] fragment title output because this can be an array Okay then let's return
[09:48:17] fragment title output first in the array.content.m map
[09:48:24] text join
[09:48:34] like this so basically this should always return a string
[09:48:40] and otherwise just return
[09:48:46] in the else here just return the content
[09:48:56] and let me just see so this is a type of string here
[09:49:02] uh and well you can just add another safety one fragment And okay but this is
[09:49:08] unreachable so I don't know why exactly uh string is not uh okay yeah my bad
[09:49:19] and now go ahead and copy this and call this generate
[09:49:25] response and basically the same thing so response output
[09:49:34] and in here we're going to just set the default to be here you go
[09:49:42] otherwise it can be this and now when we have those two in here we can put generate
[09:49:50] fragment title and in the content we can do generate
[09:49:56] response there we go and this should now improve
[09:50:02] uh our app so let's see if that is uh true or not so I'm going to do build a
[09:50:09] let's actually start a new project just to make sure everything is clear so build a calculator app
[09:50:16] like this and let's follow the ingest to see if we're going to mess something up
[09:50:22] or not i mean technically I don't think it will ever be an array of items that
[09:50:29] we're going to have to join like this it will almost always certainly be just this but uh yeah I guess we're trying it
[09:50:37] out so we successfully did this fragment title and we successfully did response
[09:50:45] generation so let's see what it came up with there we go here's what I built for you a snazzy calculator app with a sleek
[09:50:53] responsive design and we have a name this time for the fragment calculator app so that's what I wanted us to
[09:51:00] achieve right if you don't want this you don't have to use it i mean the app
[09:51:05] worked just fine before this so if this for some reason messes up your app you
[09:51:10] don't have to use it of course I just thought it would be you know fun to add that as well and you can definitely
[09:51:17] write this in a better way i mean starting with the fact that we can just do con title and just make it this
[09:51:26] so let's do output and just make it this like so
[09:51:33] there we go this is already better and then you can do the same thing here con
[09:51:39] output change this to this
[09:51:45] and then replace all instances here
[09:51:50] there we go and you can probably also just use a
[09:51:56] single function because it's exactly the same so let's maybe do parse
[09:52:02] uh agent output and in here let's go ahead and see this is a type of uh
[09:52:10] message or array so let's try value message
[09:52:16] array like that and then can I just use value
[09:52:24] con output value first in the array yeah that works
[09:52:29] as well so parse agent output then is the only function you need
[09:52:37] and you can then put it maybe at the top of the file and we are later going to move it to libs
[09:52:42] so basically parse agent output and in here it accepts the value which is a
[09:52:48] message which is an array the message is a type of message from agent kit and now
[09:52:53] that we have parse agent output let's go down here
[09:53:00] and keep the fragment title generator keep the response generator keep the two outputs and remove generate response
[09:53:07] function and now what you're just going to do is
[09:53:13] parse how did I call the function uh parse agent output
[09:53:21] and in here you're going to parse response
[09:53:27] output and in here you're going to pass
[09:53:33] fragment title output there we go and then you can move this function
[09:53:40] to utils here in the ingest so export const parse agent output and
[09:53:47] import message from inent uh inest kit here there we go
[09:53:55] then you can remove it from here find some place you're using it and then
[09:54:01] there we go import from utils like this and let's just do a sanity check here uh
[09:54:09] make the calculator use glossy glassy design or something like that the only
[09:54:18] thing I'm trying to do here is again confirm it can kind of understand the context of my previous messages and that
[09:54:25] it will give me a nice response with a name for my fragment so we can follow
[09:54:31] again inside of the running here to make sure that's what's happening
[09:54:37] there we go fragment title generator response generator
[09:54:42] and let's see here's what I built for you a sleek glassy design calculator app with a modern twist very cool so it
[09:54:50] understood that we just wanted a glassy design on top of our previous app
[09:54:57] amazing i'm very very satisfied with this uh and I think that marks the end
[09:55:03] of this chapter as always you know your app worked just fine up until this point
[09:55:08] so don't let uh this ruin your project if you don't like it or you know feel
[09:55:14] free to research a bit yourself about whether this should be descending ascending uh and if this is failing for
[09:55:23] whatever reason the fragment title generator and the response generator you can also remove them you don't need them
[09:55:29] and make sure to just use a cheaper model here simply because you can even use an entirely new model you know like
[09:55:36] uh Gemini Grock whatever because we are not calling any tools here so just make
[09:55:42] sure this is something cheap so it doesn't spend your credits for no reason when it's just generating some text uh
[09:55:48] amazing so 18 agent memory let's go ahead and review that i'm opening a new
[09:55:54] branch here 18 agent memory
[09:55:59] i'm going to stage all of my changes 18 agent memory and I'm going to commit and
[09:56:05] I'm going to publish the branch let's go ahead and open a pull request
[09:56:12] and let's review our changes
[09:56:18] and here we have the summary we enhanced message handling by retrieving and formatting previous messages for
[09:56:24] improved agent interactions we added automated generation of concise
[09:56:30] userfriendly summary messages and short descriptive fragment titles we updated
[09:56:35] the process for saving results to use dynamically generated summaries and titles instead of static content and we
[09:56:42] introduced utility functions and structured prompt templates to standardize agent outputs and in here we
[09:56:49] have just one comment and that is that we should probably check if the value is actually valid um so yeah we could add
[09:56:57] this as well and I just noticed that we return the text fragment as placeholder
[09:57:03] even though we use this both for the response and for the fragment title so I should probably add a new value
[09:57:09] something like fallback value something like that we'll see uh nevertheless very
[09:57:16] satisfied with this one i will research before the next chapter if there's something we can do uh better when it
[09:57:23] comes to adding message history but I think this is as good as we can do right
[09:57:29] now uh great so let's go ahead and change this to main and let's
[09:57:35] synchronize our changes and we should see our new poll request being merged amazing uh I believe that
[09:57:43] marks the end of this chapter amazing amazing job and see you in the next one
[09:57:50] in this chapter we're going to go over some final bug fixes and improvements in
[09:57:56] our application this will include learning how to increase the sandbox expiration making A2B template private
[09:58:04] so no one else other than your team can use it improving our conversation history from the previous chapter and
[09:58:11] overall error handling improvement in our application so let's start by learning how to make our sandboxes last
[09:58:18] longer as always ensure that you're on your main branch and make sure you have
[09:58:23] synchronized your changes the last chapter we we merged was 18 agent memory
[09:58:29] so let's learn how to increase sandbox expiration right now inside of our
[09:58:34] application if I visit uh even this one 4 minutes ago okay this one works but if
[09:58:40] you visit anything older than 5 minutes ago it will show this the sandbox wasn't found which is not ideal if you're doing
[09:58:47] some presentation or if you're showcasing this to someone so here's what how you can increase your timeout
[09:58:54] so the sandbox life cycle it will stay alive for 5 minutes by default but you
[09:58:59] can change that using the timeout parameter now of course depending if you are on free tier or if you're on premium
[09:59:05] tier you have different limits on premium tier you can keep it alive up for 24 hours but on free tier which we
[09:59:12] are on we can keep it alive for 1 hour so for example let's find something in
[09:59:17] between let's use uh half an hour i think that's a fair amount so all you can do is go inside of your functions
[09:59:26] inside of the ingest folder and in here when you create it go ahead and do await
[09:59:32] sandbox dot set timeout and now you have to enter in milliseconds right and in
[09:59:40] here you can see so the maximum time a sandbox can can be kept alive is 24
[09:59:45] hours for pro users and 1 hour for hobie users so if you want to you can set this
[09:59:52] and then this will be alive for an hour but keep in mind the longer you put this
[09:59:58] the more credits are you going to spend so what I recommend is you know find a
[10:00:03] middle ground this is half an hour so you can put this instead
[10:00:09] uh and you also have this util here I believe get sandbox now in here
[10:00:18] it's also important to increase it but you don't have to put half an hour here
[10:00:25] but um yeah let's be consistent and let's put half an hour here as well i just want to be careful and I don't want
[10:00:31] you to spend all your credits but perhaps maybe add this to some kind of
[10:00:36] constant here types.ts DS export const sandbox timeout
[10:00:43] and add a comment 30 minutes in milliseconds like this and then you can
[10:00:49] consistently use it in different places and you can easily change it if you change your mind let's go ahead and add
[10:00:56] that here sandbox timeout there we go so now we know how to increase our sandbox
[10:01:03] timeout and I will try this out i will do build a uh calculator app here and
[10:01:10] you know at the end of this chapter I'll I'll see if it still exists if it manages to do it without errors so let's
[10:01:16] see what else do we have to do here we just learned how to increase our sandbox expiration uh I'm going to leave this
[10:01:23] for last simply because we are in the middle of generating uh so let's go here
[10:01:28] improving conversation history so in the previous chapter we learned that we can
[10:01:34] add previous messages and we can add it to the state and I've been experimenting
[10:01:39] a bit and I think I found kind of a perfect combination
[10:01:45] so what I think we have to do is we have to limit our messages history because
[10:01:51] the longer the history the more confused the model gets at least that was my
[10:01:56] experience so I limited it to five messages i'm pretty sure it would work
[10:02:02] great with 10 messages also but five was somehow the sweet spot where I was able to keep a conversation going and do some
[10:02:09] small changes uh constantly and then the proper one is actually created at
[10:02:15] descending but make sure that you do reverse in here so it's actually
[10:02:22] ascending you need ascending here but since we're limiting the take we need to
[10:02:28] offset right you can also do the offset thing actually it is skipped in Prisma
[10:02:34] but honestly I'm not really sure if we need to do that and we can just do it descending and then just reverse them
[10:02:40] here and this in my opinion gave me much much better results than anything else
[10:02:47] so again I invite you to experiment but once I did this so I keep this at
[10:02:53] descending i limit this take to five and I reverse the formatted messages and this made the AI understand much better
[10:03:00] what I'm building so for example let me do make it glassy design
[10:03:07] i'm going to try and do this so we're going to see okay so we did that we
[10:03:14] improved the conversation history and now let's talk about error handling so
[10:03:19] uh error handling in our app currently doesn't exist outside of TRRPC procedures which means that all of our
[10:03:27] suspense can go wrong so here's what we can do we can do npm install react error
[10:03:35] boundary and let me show you my version here so package.json
[10:03:42] React error boundary 6.0.0 and then let's go ahead and find a
[10:03:48] random suspense here for example for loading the project so how about we add
[10:03:54] error boundary here and wrap it in suspense
[10:04:01] this is how you do error handling if you want to do it on a segment level nex.js
[10:04:09] also comes with its own error boundaries which are written the same as pages you
[10:04:16] would have error.tsx you can of course add this as well but I want to show you this so uh I'm not sure if this is error
[10:04:24] boundary from react error boundary
[10:04:30] okay I think it needs to be like this there we go and then in here you would add a fallback
[10:04:37] error like this so first let me just check if this is working there we go
[10:04:43] glassy design glassy calculator you can see it understands the context perfect
[10:04:48] so let me show you this now uh so first without error boundary so comment out
[10:04:54] error boundary I'm working inside of project ID let's go inside of uh projects get one here and in the query I
[10:05:03] want you to throw new tRPC error here with code bad request
[10:05:11] and refresh here And in here you can see it's loading project it's loading
[10:05:16] project oh uh yes my apologies no u uh I I'm
[10:05:23] trying to demonstrate this but I forgot we commented out error boundary and this happens then this is obviously not good
[10:05:30] we don't want this to happen that's why we have error boundaries like this so go
[10:05:35] ahead and refresh now and again it will keep trying to do this for 3 seconds for
[10:05:42] three attempts one two three and then finally it will hit the error and this
[10:05:48] is what you can then design as your error page right so what's important is
[10:05:54] that the error boundary is around suspense now this doesn't make too much sense
[10:06:00] because I am wrapping the whole page here right but imagine if course let's
[10:06:08] just remove this TRPC error from here imagine the case where I'm doing where
[10:06:16] is it UI components where I have the project header here right so let me see
[10:06:21] where do I render project header in the project view so go inside of your project view and in here we have
[10:06:28] suspense so the error boundary from react error boundary would make a lot of
[10:06:33] sense here fallback project header error
[10:06:40] like that or in here error boundary again around this suspense
[10:06:48] with the fallback messages container error
[10:06:54] so now let's say we go inside of the messages here let's go uh inside of
[10:07:01] messages get many and let me just try and do this so throw new tRPC error here
[10:07:07] code bad request so something happened here and let's go ahead and refresh here
[10:07:12] you can see that the project has loaded and you can see it's trying to load messages it's trying to load the messages until eventually it fails and
[10:07:21] since we added the boundary we only see messages container error but if you
[10:07:26] didn't have that here in the project view if you didn't wrap the error boundary let's see what would happen
[10:07:32] then so let's refresh again so it's loading messages it's loading messages
[10:07:38] and you already know what will happen the entire screen will error so just like minimizing the loading state you
[10:07:46] can use the error boundary to minimize the error state so that's what you would do right that's why we use the error
[10:07:52] boundary so I would recommend you know finding all the suspenses that you use in your project and I think these are
[10:08:00] the only three so we just added to all of them right and you can also do the
[10:08:05] following you can also add inside of source app you can add a page called error.tsx
[10:08:12] now this has to be a client component and in here make sure to call it error
[10:08:17] page don't call it error this is a reserved keyword call it error and you can return here global error you can of
[10:08:25] course design this however you want but this is useful so this right now doesn't
[10:08:31] do much but let's go ahead and do this let's go inside of project ID and let's say we forgot to wrap this error
[10:08:38] boundary here so now uh and yes uh also go to project
[10:08:43] view and comment out the error boundary here
[10:08:50] now the error the global error takes care right so that's how the global error works so if I didn't have this let
[10:08:57] me just remove it now if I didn't have this this is what would happen let's say
[10:09:03] we forgot all the inner error boundaries right this happens so this is the one thing
[10:09:10] you don't want to happen this error just looks ugly it looks like something really really broken right that's why
[10:09:16] you want to make sure that you have the inner error boundaries you want to make
[10:09:22] sure that you have your individual page error boundaries and you should also
[10:09:27] have your app error.tsx the sx simply because it is the last
[10:09:34] line of defense in case something goes wrong perfect so now let's go back
[10:09:40] inside of our messages procedures here let's just remove the throwing of the
[10:09:46] error here there we go perfect now what I want to do is I just want to
[10:09:52] go to the usage dsx here component and I'm really worried about this format duration for a
[10:09:59] simple reason dates can often cause errors and it would be very stupid if
[10:10:05] our entire app here fails just because the date is invalid so here's uh what I
[10:10:13] think we can do let's go ahead and try it so
[10:10:19] I'm going to open a function like this and let me
[10:10:25] just close it here and I'm going to open curly brackets here let me close that here
[10:10:34] and I'm going to open Actually here's what I'm going to do
[10:10:40] instead of trying to do it here I'm going to just do const reset time use
[10:10:46] memo like this make sure you added use memo from React and then inside of here what
[10:10:54] we're going to do is we're going to open the try and we're going to open catch and in here let's add an little error
[10:11:01] and let's do console error and let's do error formatting
[10:11:06] duration error like that and let's simply return
[10:11:13] soon so it will just say or maybe unknown or whatever you think is better user
[10:11:19] experience right and then in here let's return format duration and then inside
[10:11:25] interval to duration and then start new date and let's me just copy it
[10:11:35] and will be this and then we're just missing the format here
[10:11:42] there we go and in here let's add ms before next and then we can use this
[10:11:49] constant here so resets in
[10:11:55] reset time let me just check if it still works there we go resets in 29 days and 20
[10:12:04] hours because now if you if this MS before next happens to be something like not a number
[10:12:11] there we go resets in now doesn't work and it doesn't break the page
[10:12:17] that's what I at least wanted it to happen okay
[10:12:24] perfect so now that we have this actually I mean we can try it out by doing throw new error whoops and now it
[10:12:32] should say resets in unknown basically it cannot block the page it can still allow the user to work which is what we
[10:12:39] wanted um perfect so this is very good let's see what else we have in the list
[10:12:45] here so we learned about improving the error handling and now let's talk about making our E2B template private so if
[10:12:52] you go inside of your E2B dashboard in here you can see your templates and you can see that my Vibe Nex.js test 2 is
[10:12:59] currently public that is because we have published it the reason I told you to publish it is because I personally had
[10:13:06] problems with private uh templates but what you can do is the following open
[10:13:13] your terminal go inside of sandbox templates go inside of Next.js and since inside of here
[10:13:21] we have a E2B TOML file we can easily just do E2B template unpublish you don't
[10:13:29] have to add any other flags it will read everything from here including your team
[10:13:34] ID and just confirm that you want to unpublish it and what this does is the
[10:13:39] following if you now go back here and refresh you will see that my vibe next.js test 2
[10:13:48] is now set to private and that means that inside of the functions on the ingest here whenever someone tries to
[10:13:56] create a sandbox with that this will fail unless in their environment their
[10:14:02] E2B API key belongs to my organization so what I suggest you do now is
[10:14:09] definitely try so let's try make it red
[10:14:15] and you can see that these sandbox are still going strong so we def it definitely works what we increased the
[10:14:21] timeout for so now what I'm interested in will this still work now that I have made my template private and I think
[10:14:28] that it does since I can fetch the sandbox ID for me it happened that the sandbox ID was not able to be fetched
[10:14:35] once I changed it to private so just make sure that it still works here let's
[10:14:40] see make it red there we go and you can see how the
[10:14:46] conversation history is improved it made it glassy and red exactly what we wanted
[10:14:52] so we definitely improved the conversation history here and for me it seems to still be working if for
[10:14:58] whatever reason yours stopped working it shouldn't but you know it happened to me so maybe it will happen to you you can
[10:15:04] easily go inside of here inside of next.js and just run E2B template
[10:15:10] publish you don't need any arguments you can just press publish and then you can
[10:15:15] confirm and then from here you can go back inside of here go inside of your
[10:15:21] templates and see the status make sure it's public and you can even do that
[10:15:27] from here I think by clicking here if you want to um perfect amazing so I
[10:15:34] think that's all we wanted to fix and there is one thing left to discuss and
[10:15:40] that is let's just search for to-do instead of messages container we're using refetch interval as the live
[10:15:47] message update and I was thinking about what I should do instead of this but
[10:15:53] initially I built a project like this and it worked just fine so the thing is
[10:15:58] this is not a multiplayer chat this is a single person chat who receives responses from AI and most of the time
[10:16:06] you only send one message and then wait for the other message to uh come back
[10:16:12] and we are not just doing any kind of polling we are doing polling using the tan stack query this means that this
[10:16:19] refetch interval will ddup it will use cache it will be an extremely optimized interval and also I'm not sure if you
[10:16:26] knew this but while right now new requests are being made every 5 seconds
[10:16:33] if I change to this page requests stop being made so you don't have to worry
[10:16:39] that in the background it's constantly going to fire it is a very very optimized polling and it actually makes
[10:16:46] no problem to use in our type of application here and in fact you can
[10:16:51] even reduce it to 2 seconds if you want to this will give you a better experience and it will still be very
[10:16:57] very optimized now in case you're wondering uh okay but does inest offer
[10:17:04] any uh realtime updates they absolutely do
[10:17:09] you can go inside the documentation and read about a real time so in here you can subscribe to a channel and then from
[10:17:16] the function you can initialize uh you can publish to that channel and I
[10:17:21] explored this option but the problem was I wasn't able uh to synchronize both my
[10:17:27] Prisma messages and uh the ingest subscription messages it is absolutely
[10:17:33] possible uh and it can be a good homework for you if you want to give yourself a challenge and do that for our
[10:17:40] use case polling is more than enough so I will just remove this from here and if
[10:17:45] you want to you can move this into a constant so you can change it easily if you're using some polling in multiple
[10:17:51] places uh great amazing so I believe we are now ready to deploy i don't think
[10:17:57] there's anything else we have to do here so let's go ahead now and let's merge
[10:18:03] this so 19 bug fixes i'm going to go ahead and open a new
[10:18:09] branch 19 bug fixes
[10:18:15] i will stage all of my changes 19 bug fixes
[10:18:20] and I'm going to commit and I'm going to publish the branch uh and since these
[10:18:25] changes were very very minimal I think we can just go ahead and merge them because they were just some very small
[10:18:33] bug fixes here we can do our own review here so we added React error boundary we
[10:18:39] added global error page we added some wrappers here error
[10:18:44] boundary we added the proper sandbox timeout we properly uh reverse the messages so the
[10:18:52] conversation history is improved we use the same sandbox timeout in the
[10:18:58] utils here we reduced the refetch interval we made it safely here to fetch
[10:19:04] the reset interval and we just added some more error boundaries that's it
[10:19:09] nothing else needed here we can merge this request immediately amazing amazing
[10:19:15] job that marks the end of this chapter as always go back to your main branch
[10:19:20] here and synchronize the changes and then confirm in the source control that you just merged 19 bug fixes amazing
[10:19:29] amazing job and see you in the next chapter where we are going to deploy our app
[10:19:35] in this chapter we're going to go ahead and deploy our app to Verscell
[10:19:40] this will include the initial deployment after that we will obtain our app URL
[10:19:47] then we have to update our environment variables with that new URL and we have to redeploy and after that we have to
[10:19:55] connect inest to our versel project and redeploy once more and after that we are
[10:20:01] ready to test the app so let's start with step one deploy to versel so make
[10:20:07] sure that you are on your main branch and make sure the last one was 19 bug fixes you can synchronize your changes
[10:20:14] if you haven't already and at this point you can also shut down your terminal no point to have this running while you are
[10:20:21] deploying now let's go ahead and make sure that
[10:20:26] you have a GitHub repository right i don't know if you followed the Git workflow through this tutorial but if
[10:20:33] you have then you have a GitHub repository so head to Verscell and click
[10:20:39] add new project and in here if you are connected with GitHub you have your
[10:20:45] project right here i'm going to click import and then I'm going to open environment variables and in here I'm
[10:20:52] going to go into environment and I'm going to copy all of them and then I'm
[10:20:58] just going to paste them inside so database URL next public app URL open AI
[10:21:03] API key E2B key and all of these other ones and let's click deploy we are now
[10:21:10] going to see the result of this perhaps it will succeed from the first try or maybe it will fail i'm going to pause
[10:21:18] the screen and show you the result and my deployment failed with a bunch of
[10:21:25] errors and I forgot about the first rule of deploying to Verscell and that is
[10:21:31] that you should try building locally first so you don't waste time with
[10:21:36] failed Verscell deployments and we also forgot about one more important thing
[10:21:42] and that is that when we deploy the versel we need to add a post install script so let's go ahead and do a post
[10:21:49] install script and add it to our package.json here let me just add it
[10:21:55] here let me just check where do we add it in the scripts okay so post install prisma
[10:22:02] generate like this so now I'm going to go ahead and do npm run build locally
[10:22:08] and I'm going to see if I have any more errors and I'm going to show you how do you trigger a deployment again if your
[10:22:16] initial one failed basically from here you have buttons to go to project or to inspect deployment you can click
[10:22:23] whichever one you like uh and from here you basically have your project vibe you
[10:22:29] can click here and there we go you have deployments the first deployment was failed and now the way another
[10:22:35] deployment will be triggered is simply whenever it notices a new push in the
[10:22:41] GitHub so now let's go ahead and see what we have here so I seem to keep having these errors seemingly coming
[10:22:49] from here these errors seem to be coming from source generated so it seems to be
[10:22:56] linting this folder when it should not be linting this folder so I'm going to look into how I can prevent the app uh
[10:23:04] the build from looking at the generated folder right here and I'll tell you what
[10:23:09] I find okay I have managed to find the
[10:23:14] combination which enables npm run build so just to remind you the last change we
[10:23:21] did was we added post install to the scripts we still need this regardless so
[10:23:26] there are different ways you can fix the failing lint because the failing linting is what's going on here one solution is
[10:23:32] to go to the next config here and add slint and enable ignore during builds
[10:23:40] now this isn't exactly recommended but you can see that once you add this slint
[10:23:46] will not fire during the build process or at least it won't fire in production
[10:23:52] but you can see that in here it works perfectly fine now well whereas if you
[10:23:57] don't have this feature and you try mpm run build it is going to fail because it
[10:24:03] will try to lint our source generated uh folder there we go but I don't really
[10:24:10] recommend this simply because uh that will turn off linting for your entire
[10:24:15] project during the build and there's no need for that because what we can do instead is we can go inside of
[10:24:22] eslint.lint.config.mjs config.mjs here and we can open ignores
[10:24:30] and in here we can target asterisk asterisk forward slashgenerated and then
[10:24:37] everything inside of a generated folder so basically ignore wherever you can find the generated folder and then
[10:24:44] everything inside and I feel like this is a little bit better solution simply because we are still going to lint the
[10:24:51] rest of our project but we are not going to lint the source
[10:24:57] generated one so if you try this now it should work let's wait a second and
[10:25:03] there we go since the linting has passed everything else seems to be working just fine so try for yourself and choose one
[10:25:10] that works right if this works for you sure then use this but I will recommend
[10:25:16] doing this if possible for you in the estate config mjs perfect once you have these two let's go ahead and let's merge
[10:25:24] them uh like this and let's go ahead and add
[10:25:29] deployment here we can do this in the main branch we don't need to branch out and then just go ahead and synchronize
[10:25:35] the changes in case you branched out no problem just merge the branch to the
[10:25:41] main and once it detects a new branch to the main uh it is going to uh trigger a
[10:25:49] redeployment there we go so in here you can see that
[10:25:54] it automatically detected a new push and it's going to deploy so let's see if it
[10:26:00] succeeds this time and here we have it this time the build
[10:26:05] succeeded and now we have our app deployed so you can see it's still
[10:26:10] running some final uh things here but down here you can see that we assigned a
[10:26:16] custom domain and we have the deployment summary so what I care about is the
[10:26:21] custom domain so what I recommend you do is you click on vibe up here and go
[10:26:26] inside of overview and in here you will find all of your domains do not use the
[10:26:32] deployment domain use this one the shortest one that is the domain of your
[10:26:37] project you can go ahead and visit it if you want to and what I want you to do is
[10:26:42] I want you to copy the URL that you have
[10:26:49] and I want you to go back to Verscell and then go inside of settings
[10:26:54] environment variables and in here find next public app URL and you now have to
[10:27:00] modify this to be your new app just remove the forward slash like this and
[10:27:06] click save and after you do this you can see a prompt here to redeploy so you can
[10:27:12] click it if you don't get the prompt to redeploy you can manually go in your deployments and then you can select the
[10:27:18] last one and you can click redeploy so let me just check if uh I'm not sure if
[10:27:23] redeployment is now happening or not so I will just click redeploy myself and just confirm so every time you change
[10:27:30] environment variables you have to redeploy so I'm going to pause wait for the redeployment and then we have to
[10:27:37] connect inest to this versel project
[10:27:42] and here we have the successful uh redeployment here so now what I suggest
[10:27:48] you do is just try and use your application if possible wait out till
[10:27:54] this shows a success message as well there we go and then go to your main URL
[10:28:00] here always use the main URL and try something simple like signing in so I'm going to go ahead and use my account
[10:28:06] here and I will try to just create a simple project so I will go ahead and do
[10:28:13] uh you can see that all of our projects are saved so our TRPC is working here let's try clicking on one of these and
[10:28:20] let's try sending a message so I would add test here and what should happen here is the following you can see the
[10:28:26] message my message was generated but injust was unable to be fired that's
[10:28:31] because we need to connect inest to production so this will actually never finish let's go ahead and do that now so
[10:28:39] use the link you can see on the screen or the link in the description to visit ingest and go ahead and sign up i
[10:28:45] suggest using GitHub simply so you always have access to your repositories if needed
[10:28:51] and then once you enter here down here at the bottom you can choose to switch organization i recommend creating a new
[10:28:58] organization so I'm going to call this Vibe and I will click create organization
[10:29:03] and I'm not going to invite any members now and let's go ahead and click on apps
[10:29:09] here and let's go ahead and just find oh sorry integrations i think this is what
[10:29:15] I'm looking for and let's click on Versel here to connect let's click
[10:29:20] connect Verscell to ingest and click on add integration here and I'm I have
[10:29:28] multiple accounts so I'm going to select this one where I just deployed the project and I will click continue
[10:29:36] and in here go ahead and find your new project
[10:29:41] so let me just find Vibe here it is select it and click save configuration right here and click continue to the
[10:29:49] ingest uh Verscell dashboard and now somewhere in here you have all of your
[10:29:55] Versel projects and you should now find Vibe and you can see it says enabled but
[10:30:00] in here it says deployment protection is enabled ingest may not be able to communicate with your application by
[10:30:07] default let's go ahead and click more here and basically what we have to do is we have to configure protection bypass
[10:30:15] so in here let's go ahead and uh I'm never sure how to properly access this
[10:30:22] so don't worry I will tell you the exact steps in the versel dashboard but let me
[10:30:27] just see does this take me to Verscel it does take me to Versel here basically I think
[10:30:35] this is where I need to go let's go to versel and let's select our new project here
[10:30:41] let's go inside of settings and let's go inside of deployment protection here it is so go inside of your vibe settings
[10:30:47] deployment protection and in here let's go ahead and let's do protection
[10:30:55] bypass for automation so I think this is what we need so let's click add secret you don't need to add any value and just
[10:31:01] click save and then in here you can copy this bypass secret and then let me go
[10:31:08] ahead and go back and click click on configure here
[10:31:13] and if I remember this correctly you should now have deployment protection key that you can add here and click save
[10:31:20] configuration there we go so now inest should be able
[10:31:26] to access your uh Versell application and let's go ahead and do one more thing
[10:31:33] here so now I want to go back here to production and in here there we go you can see that
[10:31:40] my app was already found vibe development on Versel so this is a good
[10:31:45] sign and it has found one function code agent so I think that this means that
[10:31:50] it's running successfully i'm just not 100% sure i keep thinking that I need to
[10:31:56] redeploy um so h let's see let's try it out if it
[10:32:02] doesn't work it means we have to redeploy so go to your uh deployed URL this time and let's go ahead and do
[10:32:09] build a calculator app let's see if that will work and let's go
[10:32:16] inside of Ingest here ingest cloud inest runs and let's see if a new run will
[10:32:21] appear and the new run is right here that would mean that we successfully
[10:32:27] deployed our project and we connected inest to deployed instance and looks
[10:32:33] like we didn't need to redeploy at all let's just go ahead and wait to see uh
[10:32:39] if this will actually work if there are any issues we have to fix and then we're going to be able to wrap up this project
[10:32:48] and here I have the result so it seems to be working this is entirely in
[10:32:54] production so my URL is vibe-bond.cell.app
[10:32:59] and if you check the cloud here there we go it seems to be working uh if it still
[10:33:05] says running just do a refresh and it should update the status here we go amazing amazing job you finished an
[10:33:14] amazing project i had so much fun building this uh I I'm sure you did as
[10:33:20] well make sure to test your app you know make sure everything's working sometimes the easiest fix can actually be for you
[10:33:26] to redeploy again and you can see there was obviously a deployment that was running the entire time so perhaps this
[10:33:32] happened automatically when we connected inest you can always you know click here
[10:33:38] and click redeploy and that will just redeploy your latest version and now in your settings environment variables you
[10:33:44] should now see inest event keys and signing keys so that's the trick that's what made it work amazing amazing job i
[10:33:52] think this was an absolutely amazing project good job see you in the next
[10:33:59] tutorial and thank you so so much for watching