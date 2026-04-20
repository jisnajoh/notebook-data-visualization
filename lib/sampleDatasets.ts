export interface SampleDataset {
  name: string;
  description: string;
  csv: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    name: 'Heart Disease',
    description: 'UCI Heart Disease dataset with clinical measurements',
    csv: `age,sex,cp,trtbps,chol,fbs,restecg,thalachh,exng,oldpeak,slp,caa,thall,output
63,1,3,145,233,1,0,150,0,2.3,0,0,1,1
37,1,2,130,250,0,1,187,0,3.5,0,0,2,1
41,0,1,130,204,0,0,172,0,1.4,2,0,2,1
56,1,1,120,236,0,1,178,0,0.8,2,0,2,1
57,0,0,120,354,0,1,163,1,0.6,2,0,2,1
57,1,0,140,192,0,1,148,0,0.4,1,0,1,1
56,0,1,140,294,0,0,153,0,1.3,1,0,2,1
44,1,1,120,263,0,1,173,0,0,2,0,3,1
52,1,2,172,199,1,1,162,0,0.5,2,0,3,1
57,1,2,150,168,0,1,174,0,1.6,2,0,2,1
54,1,0,140,239,0,1,160,0,1.2,2,0,2,0
48,0,2,130,275,0,1,139,0,0.2,2,0,2,0
49,1,1,130,266,0,1,171,0,0.6,2,0,2,0
64,1,3,110,211,0,0,144,1,1.8,1,0,2,0
58,0,3,150,283,1,0,162,0,1,2,0,2,0`,
  },
  {
    name: 'Iris Flowers',
    description: 'Classic Iris dataset with flower measurements',
    csv: `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica`,
  },
  {
    name: 'Sales Data',
    description: 'Monthly sales data by region and product',
    csv: `month,region,product,sales,units,revenue
Jan,North,Widget A,12500,250,12500
Feb,North,Widget A,13200,264,13200
Mar,South,Widget B,9800,196,9800
Apr,South,Widget B,10500,210,10500
May,East,Widget A,15600,312,15600
Jun,East,Widget C,8900,178,8900
Jul,West,Widget B,11200,224,11200
Aug,West,Widget C,9500,190,9500
Sep,North,Widget C,14800,296,14800
Oct,South,Widget A,13700,274,13700
Nov,East,Widget B,12100,242,12100
Dec,West,Widget A,16500,330,16500`,
  },
];
