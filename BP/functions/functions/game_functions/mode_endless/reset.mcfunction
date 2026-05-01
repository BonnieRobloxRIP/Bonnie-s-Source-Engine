# = SCORES =
# // lift
scoreboard players reset lift endless
scoreboard players set start endless 0
scoreboard players set timer_s endless 20
scoreboard players set timer_ms endless 0
scoreboard players reset p_game endless
scoreboard players reset room_count endless
scoreboard players reset difficulty endless
scoreboard players reset room endless
scoreboard players set reset endless 0
scoreboard players reset variant endless
scoreboard players reset loaded endless
scoreboard players reset started endless
# // buttons
scoreboard players reset R1B1 endless
scoreboard players reset R1B2 endless
scoreboard players reset R1B3 endless
scoreboard players reset R1B4 endless
scoreboard players reset R1B5 endless
scoreboard players reset R1B6 endless
scoreboard players reset R1B7 endless
scoreboard players reset R1B8 endless
scoreboard players reset R1B9 endless
scoreboard players reset R1B10 endless
scoreboard players reset R2B1 endless
scoreboard players reset R2B2 endless
scoreboard players reset R2B3 endless
scoreboard players reset R2B4 endless
scoreboard players reset R2B5 endless
scoreboard players reset R2B6 endless
scoreboard players reset R2B7 endless
scoreboard players reset R2B8 endless
scoreboard players reset R2B9 endless
scoreboard players reset R2B10 endless
scoreboard players reset R3B1 endless
scoreboard players reset R3B2 endless
scoreboard players reset R3B3 endless
scoreboard players reset R3B4 endless
scoreboard players reset R3B5 endless
scoreboard players reset R3B6 endless
scoreboard players reset R3B7 endless
scoreboard players reset R3B8 endless
scoreboard players reset R3B9 endless
scoreboard players reset R3B10 endless
# // flooding
scoreboard players reset flood endless
scoreboard players reset endless_timer_s endless
scoreboard players reset endless_timer_ms endless
# // exit tunnel
scoreboard players reset p_tunnel endless
scoreboard players reset endless_transition endless
scoreboard players reset endless_end endless
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=endless] at @s run structure load mystructure:EndlessRemove ~-16 ~1 ~-16
# // kill
execute as @e[type=brr:flood_room, name=endless] at @s run kill @s
# = PLAYERS =
tp @a[tag=endless] 23 23 38
tag @a[x=23, y=23, z=38, dx=0,dy=1,dz=0] remove endless
tag @a[x=23, y=23, z=38, dx=0,dy=1,dz=0] remove endlesslift
tag @a[x=23, y=23, z=38, dx=0,dy=1,dz=0] remove endlesstunnel
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§9Endless Mode has been Reset!"}]}