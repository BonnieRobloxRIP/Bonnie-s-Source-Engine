# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=medium_room1_anchor] at @s if score loaded2 medium matches 0 run summon brr:flood_room ^-1 ^-2 ^-8 0 0 * medium_room2
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run kill @e[type=brr:flood_room, name=medium_room1_anchor]
# // Level
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run structure load "medium/room2/2_advanced_tech:MediumRoom2V2" ~-7 ~1 ~-14
# // Next Room Anchor
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run summon brr:flood_room ^-4 ^19 ^-14 0 0 * medium_room2_anchor
# // - Scores -
# // buttons
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players add R2B1 medium 0
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players random R2C1 medium 0 1
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players random R2C2 medium 0 1
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players random R2C3 medium 0 1
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players random R2C4 medium 0 1
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players random R2C5 medium 0 1
# // essential
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players add r2_end medium 0
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players add R2Code medium 0
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players add R2Ambiance medium 0
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players add R2Animation medium 0
# // = End =
execute as @e[type=brr:flood_room, name=medium_room2] at @s if score loaded2 medium matches 0 run scoreboard players set loaded2 medium 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium:MediumTunnel" ~ ~1 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room2:MediumRoom2" ~-7 ~1 ~-14
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room2/2_advanced_tech:MediumRoom2V2" ~-7 ~1 ~-14
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B1 endless 0
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R2C1 endless 0 1
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R2C2 endless 0 1
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R2C3 endless 0 1
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R2C4 endless 0 1
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R2C5 endless 0 1
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2Code endless 0
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2Ambiance endless 0
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2Animation endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^1.5 ^2 ^11 facing ^1.5 ^2 ^7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1