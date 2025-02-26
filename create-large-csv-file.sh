echo "id,name,desc,age" > large-file-input.csv
for i in `seq 1 20`; do node -e "process.stdout.write('$i,caio[$i],$i-desc,$i\n'.repeat(1e5))" >> large-file-input.csv; done