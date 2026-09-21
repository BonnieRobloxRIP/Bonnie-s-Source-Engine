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
function lobby_functions/animations/fans
function lobby_functions/animations/lights
function lobby_functions/misc/global_sfx
# // victory
execute if score easy_victory lobby matches 1 run function lobby_functions/animations/victory
execute if score medium_victory lobby matches 1 run function lobby_functions/animations/victory
execute if score hard_victory lobby matches 1 run function lobby_functions/animations/victory
execute if score lift lobby matches 1.. unless score easy_victory lobby matches 1 unless score medium_victory lobby matches 1 unless score hard_victory lobby matches 1 run function lobby_functions/animations/victory
# = TEMPORARY =
execute as @a[tag=easy] at @s if block ~ ~ ~ water run kill @s
execute as @a[tag=medium] at @s if block ~ ~ ~ water run kill @s
execute as @a[tag=hard] at @s if block ~ ~ ~ water run kill @s
execute as @a[tag=extreme] at @s if block ~ ~ ~ water run kill @s
execute as @a[tag=endless] at @s if block ~ ~ ~ water run kill @s
kill @a[tag=lobby, tag=!host, x=-12, y=-35, z=27, dx=23, dy=2, dz=29]

#execute if score enabled lobby matches 2.. run gamemode c @a[tag=host, tag=!easy, tag=!medium, tag=!hard, tag=!easylift, tag=!mediumlift, tag=!hardlift, tag=!spectator]


# = teaser =
execute if score teaser lobby matches 1 run scoreboard players add teaser1 lobby 1
execute if score teaser1 lobby matches 1 run camera @a fade time 0 0 4 color 0 0 0
execute if score teaser1 lobby matches 1 run camera @a set minecraft:free pos -56 81 6 facing -56 80 6
execute if score teaser1 lobby matches 5 run camera @a set minecraft:free ease 20 in_quad pos -60 81 6
execute if score teaser1 lobby matches 350 run camera @a set minecraft:free ease 14 spring facing -74 85 6
execute if score teaser1 lobby matches 510 run structure load teaser1a -77 86 3 0_degrees none block_by_block 2
execute if score teaser1 lobby matches 525 run structure load teaser1 -77 86 3 0_degrees none block_by_block 1
execute if score teaser1 lobby matches 525 run camera @a fov_set 110 4 in_quad
execute if score teaser1 lobby matches 550 run structure load teaser1a -77 86 3 0_degrees none block_by_block 2
execute if score teaser1 lobby matches 600 run camera @a fov_set 40 2 in_quad
execute if score teaser1 lobby matches 630 run camera @a fade time 0 10 0 color 0 0 0
execute if score teaser1 lobby matches 630 run title @a times 100 100 100
execute if score teaser1 lobby matches 640 run title @a title §5§lEXTREME MODE
execute if score teaser1 lobby matches 690 run title @a subtitle §5§lis coming.
execute if score teaser1 lobby matches 690 run camera @a fade time 0 10 0 color 0 0 0
execute if score teaser1 lobby matches 780 run title @a title §8§lsoon :>
execute if score teaser1 lobby matches 780 run camera @a fade time 0 10 0 color 0 0 0
execute if score teaser1 lobby matches 850 run camera @a fade time 0 10 0 color 0 0 0
execute if score teaser1 lobby matches 950 run camera @a fade time 0 10 0 color 0 0 0


execute if score teaser1 lobby matches 1200 run structure load teaser1 -77 86 3 0_degrees none block_by_block 1
execute if score teaser1 lobby matches 1200.. run scoreboard players set teaser lobby 0
execute if score teaser1 lobby matches 1200.. run camera @a clear
execute if score teaser1 lobby matches 1200.. run camera @a fov_clear
execute if score teaser1 lobby matches 1200.. run scoreboard players reset teaser1 lobby

