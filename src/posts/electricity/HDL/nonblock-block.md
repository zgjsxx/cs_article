# verilog 

a = 2, b = 1

b = 2, c = 1

```verilog
always @( posedge clk )
begin
    b<=a;
    c<=b;
end
```

a = 2, b = 1

b = 2, c = 2

```verilog
always @(posedge clk)
begin
    b=a;
    c=b;
end
```