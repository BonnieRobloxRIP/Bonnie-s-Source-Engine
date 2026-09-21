# = when someone leaves, it will run this to clear any "player offline" =
# // remove
scoreboard objectives remove display_easy
scoreboard objectives remove display_medium
scoreboard objectives remove display_hard
scoreboard objectives remove display_extreme
scoreboard objectives remove display_endless
# // re-add
scoreboard objectives add display_easy dummy "§a§lEasy Mode Wins"
scoreboard objectives add display_medium dummy "§e§lMedium Mode Wins"
scoreboard objectives add display_hard dummy "§4§lHard Mode Wins"
scoreboard objectives add display_extreme dummy "§5§lExtreme Mode Wins"
scoreboard objectives add display_endless dummy "§9§lEndless Mode Ranking"
# // restore display
execute if score display lobby matches 1..199 run scoreboard objectives setdisplay belowname display_easy
execute if score display lobby matches 1..199 run scoreboard objectives setdisplay sidebar display_easy
execute if score display lobby matches 200..399 run scoreboard objectives setdisplay belowname display_medium
execute if score display lobby matches 200..399 run scoreboard objectives setdisplay sidebar display_medium
execute if score display lobby matches 400..599 run scoreboard objectives setdisplay belowname display_hard
execute if score display lobby matches 400..599 run scoreboard objectives setdisplay sidebar display_hard
execute if score display lobby matches 600..799 run scoreboard objectives setdisplay belowname display_extreme
execute if score display lobby matches 600..799 run scoreboard objectives setdisplay sidebar display_extreme
execute if score display lobby matches 800..999 run scoreboard objectives setdisplay belowname display_endless
execute if score display lobby matches 800..999 run scoreboard objectives setdisplay sidebar display_endless