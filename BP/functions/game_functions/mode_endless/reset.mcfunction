# = ROOMS =
# Stop the room script for this mode (BP/scripts/rooms). The room entities are cleaned up below.
scriptevent brr:rooms stop endless
# = SCORES =
# // lift
scoreboard players reset lift endless
scoreboard players set start endless 0
scoreboard players set timer_s endless 10
scoreboard players set timer_ms endless 0
scoreboard players reset p_game endless
scoreboard players reset room_count endless
scoreboard players set reset endless 0
scoreboard players reset started endless
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=endless] at @s run structure load "endless:EndlessRemove" ~-16 ~1 ~-16
# // kill
execute as @e[type=brr:flood_room, name=endless] at @s run kill @s
kill @e[type=brr:flood_room, name=laser, tag=endless]
# = PLAYERS =
tp @a[tag=endless] 23 23 38
tag @a[x=23, y=23, z=38, dx=0,dy=1,dz=0] remove endless
tag @a[x=23, y=23, z=38, dx=0,dy=1,dz=0] remove endlesslift
tag @a[x=23, y=23, z=38, dx=0,dy=1,dz=0] remove endlesstunnel
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§9Endless Mode has been Reset!"}]}