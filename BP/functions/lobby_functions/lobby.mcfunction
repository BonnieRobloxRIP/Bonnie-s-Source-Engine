# = SPAWN =

# = SCORES =

# = FUNCTIONS =
# // essential
function lobby_functions/misc/music
function lobby_functions/misc/actionbar
function lobby_functions/misc/scoreboard
function lobby_functions/misc/spawn
# // details
function lobby_functions/animations/doors
function lobby_functions/animations/elevators
function lobby_functions/animations/engines
function lobby_functions/animations/fans
function lobby_functions/animations/lights
# = TEMPORARY =
execute as @a at @s if block ~ ~ ~ water run kill @s
kill @a[tag=lobby, x=-12, y=-35, z=27, dx=23, dy=2, dz=29]