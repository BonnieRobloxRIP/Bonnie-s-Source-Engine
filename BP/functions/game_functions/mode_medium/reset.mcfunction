# = SCORES =
scoreboard players set started medium 0
scoreboard players set started2 medium 0
scoreboard players set started3 medium 0
scoreboard players set started4 medium 0
scoreboard players set reset medium 0
# // lift
scoreboard players reset lift medium
scoreboard players set start medium 0
scoreboard players set timer_s medium 20
scoreboard players set timer_ms medium 0
scoreboard players reset alarm medium
structure load "medium:MediumStateAvailable" -3 93 50
# // game
scoreboard players set r1_timer_ms medium 0
scoreboard players set r1_timer_s medium 20
scoreboard players set r2_timer_ms medium 0
scoreboard players set r2_timer_s medium 21
scoreboard players set r3_timer_ms medium 0
scoreboard players set r3_timer_s medium 21
scoreboard players reset R1B1 medium
scoreboard players reset R1B2 medium
scoreboard players reset R1B3 medium
scoreboard players reset R1B4 medium
scoreboard players reset R1B5 medium
scoreboard players reset R1B6 medium
scoreboard players reset R1B7 medium
scoreboard players reset R1B8 medium
scoreboard players reset R1B9 medium
scoreboard players reset R1B10 medium
scoreboard players reset R2B1 medium
scoreboard players reset R2B2 medium
scoreboard players reset R2B3 medium
scoreboard players reset R2B4 medium
scoreboard players reset R2B5 medium
scoreboard players reset R2B6 medium
scoreboard players reset R2B7 medium
scoreboard players reset R2B8 medium
scoreboard players reset R2B9 medium
scoreboard players reset R2B10 medium
scoreboard players reset R3B1 medium
scoreboard players reset R3B2 medium
scoreboard players reset R3B3 medium
scoreboard players reset R3B4 medium
scoreboard players reset R3B5 medium
scoreboard players reset R3B6 medium
scoreboard players reset R3B7 medium
scoreboard players reset R3B8 medium
scoreboard players reset R3B9 medium
scoreboard players reset R3B10 medium
scoreboard players reset R1B1a medium
scoreboard players reset R1B2a medium
scoreboard players reset R1B3a medium
scoreboard players reset R1B4a medium
scoreboard players reset R1B5a medium
scoreboard players reset R1B6a medium
scoreboard players reset R1B7a medium
scoreboard players reset R1B8a medium
scoreboard players reset R1B9a medium
scoreboard players reset R1B10a medium
scoreboard players reset R2B1a medium
scoreboard players reset R2B2a medium
scoreboard players reset R2B3a medium
scoreboard players reset R2B4a medium
scoreboard players reset R2B5a medium
scoreboard players reset R2B6a medium
scoreboard players reset R2B7a medium
scoreboard players reset R2B8a medium
scoreboard players reset R2B9a medium
scoreboard players reset R2B10a medium
scoreboard players reset R3B1a medium
scoreboard players reset R3B2a medium
scoreboard players reset R3B3a medium
scoreboard players reset R3B4a medium
scoreboard players reset R3B5a medium
scoreboard players reset R3B6a medium
scoreboard players reset R3B7a medium
scoreboard players reset R3B8a medium
scoreboard players reset R3B9a medium
scoreboard players reset R3B10a medium
scoreboard players set loaded1 medium 0
scoreboard players set loaded2 medium 0
scoreboard players set loaded3 medium 0
scoreboard players reset flood1 medium
scoreboard players reset flood2 medium
scoreboard players reset flood3 medium
scoreboard players reset room1 medium
scoreboard players reset room2 medium
scoreboard players reset room3 medium
scoreboard players reset p_game medium
scoreboard players reset p_lift medium
scoreboard players reset p_amount medium
scoreboard players reset p_won medium
scoreboard players reset r1_end medium
scoreboard players reset r2_end medium
scoreboard players reset r3_end medium
scoreboard players reset p_tunnel1 medium
scoreboard players reset p_tunnel2 medium
scoreboard players reset p_tunnel3 medium
scoreboard players reset r1_transition medium
scoreboard players reset r2_transition medium
scoreboard players reset r3_transition medium
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=medium_room1] at @s run structure load "medium:MediumRoom1" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=medium_room2] at @s run structure load "easy/room2:Room2Remove" ~-7 ~1 ~-7 180_degrees
execute as @e[type=brr:flood_room, name=medium_room3] at @s run structure load "easy/room3:Room3Remove" ~-16 ~1 ~-7 180_degrees
structure load "medium:MediumRoom1" 1 -58 45
# // kill
execute as @e[type=brr:flood_room, name=medium_room1] at @s run kill @s
execute as @e[type=brr:flood_room, name=medium_room2] at @s run kill @s
execute as @e[type=brr:flood_room, name=medium_room3] at @s run kill @s
# = PLAYERS =
tp @a[tag=medium] 0 86 -16
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§eMedium Mode has been Reset!"}]}