# = SCOREBOARD OPERATIONS =
scoreboard players add @a[tag=lobby] storage_easy 0
scoreboard players add @a[tag=lobby] storage_medium 0
scoreboard players add @a[tag=lobby] storage_hard 0
scoreboard players add @a[tag=lobby] storage_extreme 0
scoreboard players add @a[tag=lobby] storage_endless 0
execute as @a at @s run scoreboard players operation @s display_easy = @s storage_easy
execute as @a at @s run scoreboard players operation @s display_medium = @s storage_medium
execute as @a at @s run scoreboard players operation @s display_hard = @s storage_hard
execute as @a at @s run scoreboard players operation @s display_extreme = @s storage_extreme
execute as @a at @s run scoreboard players operation @s display_endless = @s storage_endless
# = ROTATE SCOREBOARD DISPLAY =
#scoreboard players add display lobby 1
execute if score display lobby matches 1 run scoreboard objectives setdisplay belowname display_easy
execute if score display lobby matches 1 run scoreboard objectives setdisplay sidebar display_easy
execute if score display lobby matches 200 run scoreboard objectives setdisplay belowname display_medium
execute if score display lobby matches 200 run scoreboard objectives setdisplay sidebar display_medium
execute if score display lobby matches 400 run scoreboard objectives setdisplay belowname display_hard
execute if score display lobby matches 400 run scoreboard objectives setdisplay sidebar display_hard
execute if score display lobby matches 600 run scoreboard objectives setdisplay belowname display_extreme
execute if score display lobby matches 600 run scoreboard objectives setdisplay sidebar display_extreme
execute if score display lobby matches 800 run scoreboard objectives setdisplay belowname display_endless
execute if score display lobby matches 800 run scoreboard objectives setdisplay sidebar display_endless
execute if score display lobby matches 1000.. run scoreboard players set display lobby 0