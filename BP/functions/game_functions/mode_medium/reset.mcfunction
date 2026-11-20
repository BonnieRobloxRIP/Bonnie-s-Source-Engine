# = ROOMS =
# Stop the room script for this mode (BP/scripts/rooms). The room entities are cleaned up below.
scriptevent brr:rooms stop medium
# = SCORES =
scoreboard players set started medium 0
scoreboard players set reset medium 0
# // lift
scoreboard players reset lift medium
scoreboard players set start medium 0
scoreboard players set timer_s medium 10
scoreboard players set timer_ms medium 0
scoreboard players reset alarm medium
structure load "medium:MediumStateAvailable" -3 93 50
# // game
scoreboard players reset room1 medium
scoreboard players reset room2 medium
scoreboard players reset room3 medium
scoreboard players reset p_game medium
scoreboard players reset p_lift medium
scoreboard players reset p_amount medium
scoreboard players reset p_won medium
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=medium_room1] at @s run structure load "medium/room1:MediumRoom1" ~-7 ~1 ~-14
execute as @e[type=brr:flood_room, name=medium_room2] at @s run structure load "easy/room2:Room2Remove" ~-7 ~1 ~-14 180_degrees
execute as @e[type=brr:flood_room, name=medium_room3] at @s run structure load "easy/room3:Room3Remove" ~-16 ~1 ~-14 180_degrees
structure load "medium/room1:MediumRoom1" -7 -58 17
# // kill
execute as @e[type=brr:flood_room, name=medium_room1] at @s run kill @s
execute as @e[type=brr:flood_room, name=medium_room2] at @s run kill @s
execute as @e[type=brr:flood_room, name=medium_room3] at @s run kill @s
# = PLAYERS =
tp @a[tag=medium] 0 86 -16
tp @a[tag=mediumlift2] 0 89 53
gamemode a @a[tag=mediumlift2]
tag @a[tag=spectator, tag=mediumlift2] remove spectator
tag @a remove mediumlift2
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§eMedium Mode has been Reset!"}]}