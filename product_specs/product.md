CE APP

1. USERS
    1. events admin
    2. billing admin
    3. user
    4. guest
    5. super admin

2. UI PAGE
    1. system pages
        1. landing page (guest)
        2. login
        4. admin dashboard
        5. events dashboard
        6. billing dashboard
        7. user dashboard (announcements)
        8. guest dashboard (announcements)
        9. super admin dashboard
        10. logout
        11. forgot password
        12. reset password
        13. change password
        14. profile
        15. settings
        16. help
        17. about
        18. contact
        19. terms
        20. privacy
    2. event pages
        1. event page
        2. event registration
        3. event attendance
        4. event analytics
        5. event reporting
        6. event notification
        7. event reminder
        8. event calendar
        9. event search
        10. event sorting
        11. event filtering
        12. event pagination
        13. event export
        14. event import
        15. event backup
        16. event restore
        17. event delete
        18. event update
        19. event create
        20. event view
        21. event edit
        22. event add
        23. scan qr code
        24. response qr code
    3. billing pages
        1. billing page
        2. billing registration
        3. billing attendance
        4. billing analytics
        5. billing reporting
        6. billing notification
        7. billing reminder
        8. billing calendar
        9. billing search
        10. billing sorting
        11. billing filtering
        12. billing pagination
        13. billing export
        14. billing import
        15. billing backup
        16. billing restore
        17. billing delete
        18. billing update
        19. billing create
        20. billing view
        21. billing edit
        22. billing add

3. Features
    1. user management
    2. role management
    3. permission management
    4. audit log
    5. notification
    6. Event management
        1. qr code system
            1. qr code generator
            2. qr code reader
            3. qr code printer
            4. qr code validator
            5. qr code history
        2. Event registration
            1. Event attendance
            2. Event analytics
            3. Event reporting
            4. Event notification
            5. Event reminder
            6. Event calendar
            7. Event search
            8. Event sorting
            9. Event filtering
            10. Event pagination
            11. Event export
            12. Event import
            13. Event backup
            14. Event restore
            15. Event delete
            16. Event update
            17. Event create
            18. Event view
            19. Event edit
            20. Event add
    7. Billing management
        1. Payment management
            1. Payment history
            2. Payment processing
            3. Payment notification
            4. Payment reminder
            5. Payment calendar
            6. Payment search
            7. Payment sorting
            8. Payment filtering
            9. Payment pagination
            10. Payment export
            11. Payment import
            12. Payment backup
            13. Payment restore
            14. Payment delete
            15. Payment update
            16. Payment create
            17. Payment view
            18. Payment edit
            19. Payment add
        2. Invoice management
            1. Invoice history
            2. Invoice processing
            3. Invoice notification
            4. Invoice reminder
            5. Invoice calendar
            6. Invoice search
            7. Invoice sorting
            8. Invoice filtering
            9. Invoice pagination
            10. Invoice export
            11. Invoice import
            12. Invoice backup
            13. Invoice restore
            14. Invoice delete
            15. Invoice update
            16. Invoice create
            17. Invoice view
            18. Invoice edit
            19. Invoice add
        


Admin
1. Admin dashboard
2. admin permissions -> add a feature where when user is staff or admin, you can choose what feature they can access
3. admin permission preset -> add preset to staffs. (events admin can only access event management, event staff can only access ticket scanner and the can only see certain events)
4. for user management, invited users must show up on a dedicated **Invited** tab (default view) with lifecycle metadata (sent date, last sent date, reminder count, inviter) and conflict badges.
5. admins can resend or revoke invites directly from the Invited tab, respecting reminder caps and logging every action.
6. admin should be able to edit any user's info, it could be name, email or even add permissions if the user is an admin or staff.
7. in the user management page, add a search for user full name or email. also add a filter for active and inactive users. Show active users by default.
8. The user table includes full name, email, role, status, joined date, last login.
9. Change the post to memorandum type in the content page. - done


Member
1. member dashboard
2. create a engagement their there are two ranking systems involve, one is for the app visit engagement and the second one is for frequency the user joins the events. ex. a user joins 1-3 events in a year have bronze badge, 4-8 silver badge and 9 and up gets a gold badge. but if on the consecutive year the user declined in attendance, the badge changes and lowers.
3. profile page, which shows last login, tickets owned, user engagement (how often the user visits the page and the amount of events he/she joined. based on that there will be a badge based on the user engament)
4. member billing page show the how much is the current bill, the last 3 bills and remainder on when to settle their bills.
5. members can interact with any of the annoucements, events or posts by ticking interested icon on each of the posts.




event scanning
1. once ticket is scan, it will show the ticket name holder and how many ticket they own for that event. ex (Joe Doe 1 out of 4 scanned.) there is also a confirm button once click the qr code ticket would be checked in.
2. The qr code should also contain the ticket number below the qr code itself to help with manual verification.


