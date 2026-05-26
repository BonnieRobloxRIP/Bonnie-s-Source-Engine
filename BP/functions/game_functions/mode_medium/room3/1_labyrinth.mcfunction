# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=medium_room2_anchor] at @s if score loaded3 medium matches 0 run summon brr:flood_room ^-3 ^-2 ^-8 0 0 * medium_room3
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run kill @e[type=brr:flood_room, name=medium_room2_anchor]
# // Level
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run structure load "medium/room3/1_labyrinth:MediumRoom3V1" ~-16 ~1 ~-7
# // Exit Room Anchor
#execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run summon brr:flood_room ^9 ^19 ^-4 0 0 * medium_room3_anchor
# // - Scores -
# // buttons
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B1 medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B2 medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B3 medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B4 medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B5 medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B6 medium 0
# // essential
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add r3_end medium 0
# // = End =
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players set loaded3 medium 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium:MediumTunnel" ~2 ~1 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room3:MediumRoom3" ~-16 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room3/1_labyrinth:MediumRoom3V1" ~-16 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B2 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B3 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B4 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B5 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B6 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^3.5 ^2 ^11 facing ^3.5 ^2 ^8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1
