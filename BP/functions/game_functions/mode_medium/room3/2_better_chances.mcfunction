# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=medium_room2_anchor] at @s if score loaded3 medium matches 0 run summon brr:flood_room ^-3 ^-2 ^-8 0 0 * medium_room3
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run kill @e[type=brr:flood_room, name=medium_room2_anchor]
# // Level
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run structure load "medium/room3/2_better_chances:MediumRoom3V2" ~-16 ~1 ~-7
# // Exit Room Anchor
#execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run summon brr:flood_room ^9 ^19 ^-4 0 0 * medium_room3_anchor
# // - Scores -
# // buttons
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add R3B1 medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players random R3B1P medium 1 10
# // essential
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players add r3_end medium 0
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 1 run setblock ^2 ^4 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 2 run setblock ^4 ^4 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 3 run setblock ^-2 ^4 ^-4 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="south"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 4 run setblock ^-6 ^4 ^4 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 5 run setblock ^-1 ^8 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 6 run setblock ^6 ^8 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 7 run setblock ^-3 ^12 ^-2 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="north"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 8 run setblock ^-1 ^12 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="north"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 8 run setblock ^-1 ^12 ^7 chiseled_stone_bricks
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 9 run setblock ^6 ^16 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 10 run setblock ^-6 ^20 ^-1 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 if score R3B1P medium matches 10 run setblock ^-7 ^20 ^-1 chiseled_stone_bricks
# // = End =
execute as @e[type=brr:flood_room, name=medium_room3] at @s if score loaded3 medium matches 0 run scoreboard players set loaded3 medium 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium:MediumTunnel" ~2 ~1 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room3:MediumRoom3" ~-16 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "medium/room3/2_better_chances:MediumRoom3V2" ~-16 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players random R3B1P endless 1 10
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 1 run setblock ^2 ^4 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 2 run setblock ^4 ^4 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 3 run setblock ^-2 ^4 ^-4 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="south"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 4 run setblock ^-6 ^4 ^4 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 5 run setblock ^-1 ^8 ^-3 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 6 run setblock ^6 ^8 ^-5 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="west"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 7 run setblock ^-3 ^12 ^-2 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="north"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 8 run setblock ^-1 ^12 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="north"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 8 run setblock ^-1 ^12 ^7 chiseled_stone_bricks
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 9 run setblock ^6 ^16 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="up"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 10 run setblock ^-6 ^20 ^-1 brr:flood_button["brr:button_type"="exit","brr:pressed"=false, "minecraft:block_face"="east"]
execute as @e[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 if score R3B1P endless matches 10 run setblock ^-7 ^20 ^-1 chiseled_stone_bricks
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^3.5 ^2 ^11 facing ^3.5 ^2 ^8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1
