# = ROOMS =
# Stop the room script for this mode (BP/scripts/rooms). The room entities are cleaned up below.
scriptevent brr:rooms stop easy
# = SCORES =
scoreboard players set started easy 0
scoreboard players set reset easy 0
# // lift
scoreboard players reset lift easy
scoreboard players set start easy 0
scoreboard players set timer_s easy 10
scoreboard players set timer_ms easy 0
scoreboard players reset alarm easy
structure load "lobby/elevators:MainElevator" 6 87 50
structure load "easy:EasyStateAvailable" 5 93 49
event entity @e[type=brr:mainelevator, name=easylift] brr:despawn
# // game
scoreboard players reset room1 easy
scoreboard players reset room2 easy
scoreboard players reset room3 easy
scoreboard players reset p_game easy
scoreboard players reset p_lift easy
scoreboard players reset p_amount easy
scoreboard players reset p_won easy
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=easy_room1] at @s run structure load "easy/room1:EasyRoom1" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=easy_room2] at @s run structure load "easy/room2:Room2Remove" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=easy_room3] at @s run structure load "easy/room3:Room3Remove" ~-16 ~1 ~-7
execute as @e[type=brr:flood_room, name=easy_exit] at @s run structure load "easy/exit_room:EasyExitRoomRemove" ~-5 ~-2 ~-7
structure load "easy/room1:EasyRoom1" 1 -58 45
# // kill
execute as @e[type=brr:flood_room, name=easy_room1] at @s run kill @s
execute as @e[type=brr:flood_room, name=easy_room2] at @s run kill @s
execute as @e[type=brr:flood_room, name=easy_room3] at @s run kill @s
execute as @e[type=brr:flood_room, name=easy_exit] at @s run kill @s
# = PLAYERS =
tp @a[tag=easy] 0 86 -16
tp @a[tag=easylift2] 8 89 52
gamemode a @a[tag=easylift2]
tag @a[tag=spectator, tag=easylift2] remove spectator
tag @a remove easylift2
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§aEasy Mode has been Reset!"}]}