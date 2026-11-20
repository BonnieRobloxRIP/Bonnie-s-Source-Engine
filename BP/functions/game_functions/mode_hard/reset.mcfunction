# = ROOMS =
# Stop the room script for this mode (BP/scripts/rooms). The room entities are cleaned up below.
scriptevent brr:rooms stop hard
# = SCORES =
scoreboard players set started hard 0
scoreboard players set reset hard 0
# // lift
scoreboard players reset lift hard
scoreboard players set start hard 0
scoreboard players set timer_s hard 10
scoreboard players set timer_ms hard 0
scoreboard players reset alarm hard
structure load "hard:HardStateAvailable" -11 93 49
# // game
scoreboard players reset soundtrack hard
scoreboard players reset room1 hard
scoreboard players reset room2 hard
scoreboard players reset room3 hard
scoreboard players reset p_game hard
scoreboard players reset p_lift hard
scoreboard players reset p_amount hard
scoreboard players reset p_won hard
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=hard_room1] at @s run structure load "hard/room1:HardRoom1" ~-14 ~1 ~-7
execute as @e[type=brr:flood_room, name=hard_room2] at @s run structure load "easy/room2:Room2Remove" ~-14 ~1 ~-7
execute as @e[type=brr:flood_room, name=hard_room3] at @s run structure load "easy/room3:Room3Remove" ~-16 ~1 ~-7
execute as @e[type=brr:flood_room, name=hard_exit] at @s run structure load "hard/exit_room:HardExitRoomRemove" ~-5 ~-2 ~-7
structure load "hard/room1:HardRoom1" -22 -58 45
# // kill
execute as @e[type=brr:flood_room, name=hard_room1] at @s run kill @s
execute as @e[type=brr:flood_room, name=hard_room2] at @s run kill @s
execute as @e[type=brr:flood_room, name=hard_room3] at @s run kill @s
execute as @e[type=brr:flood_room, name=hard_exit] at @s run kill @s
execute as @e[type=brr:flood_room, name=laser, tag=hard] at @s run kill @s
# = PLAYERS =
tp @a[tag=hard] 0 86 -16
tp @a[tag=hardlift2] -8 89 52
gamemode a @a[tag=hardlift2]
tag @a[tag=spectator, tag=hardlift2] remove spectator
tag @a remove hardlift2
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§4Hard Mode has been Reset!"}]}