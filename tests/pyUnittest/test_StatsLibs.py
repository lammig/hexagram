import os, sys, glob, filecmp, shutil, csv
import unittest
from rootDir import *

rootDir = getRootDir()
pythonDir = rootDir + '.python/'
serverDir = rootDir + 'server/'
sys.path.append(pythonDir)
sys.path.append(serverDir)
from statsLayer import ForEachLayer

class TestStatsLibs(unittest.TestCase):
    """
    def test_layoutInd_binCont_noValues(s):

        # Test the layout-independent binary-continuous stats
        contLayers = ['height']
        layerA = 'kirc-groups'
        layerB = 'height'

        kircGbmHexnames = ['TCGA-AK-3443','TCGA-BP-5198','TCGA-A3-3363','TCGA-BP-5010','TCGA-CZ-4860','TCGA-CZ-5457','TCGA-CJ-6028','TCGA-DV-5565','TCGA-CZ-4858','TCGA-CZ-4857','TCGA-B0-4700','TCGA-B8-4620','TCGA-B0-5096','TCGA-CW-6087','TCGA-B0-5100','TCGA-B0-4696','TCGA-CZ-5469','TCGA-BP-4766','TCGA-BP-4960','TCGA-BP-4967','TCGA-A3-3346','TCGA-B0-4690','TCGA-B8-4622','TCGA-CJ-4635','TCGA-AK-3430','TCGA-B0-4811','TCGA-BP-4992','TCGA-A3-3385','TCGA-CZ-5470']
        kircMainHexnames = ['TCGA-B0-5085','TCGA-B0-4718','TCGA-A3-3343','TCGA-BP-4965','TCGA-BP-4995','TCGA-BP-5174','TCGA-BP-4353','TCGA-B0-5703','TCGA-B8-5164','TCGA-A3-3359','TCGA-B0-5077','TCGA-CJ-4643','TCGA-DV-5574','TCGA-CJ-4895','TCGA-CJ-5686','TCGA-CJ-6027','TCGA-B0-4852','TCGA-AK-3458','TCGA-BP-5196','TCGA-B0-5095','TCGA-B2-4099','TCGA-AK-3444','TCGA-BP-4335','TCGA-BP-4163','TCGA-CW-5590','TCGA-BP-5181','TCGA-B8-4151','TCGA-B0-5107','TCGA-BP-4159','TCGA-B0-4693','TCGA-B2-4101','TCGA-BP-4804','TCGA-A3-3351','TCGA-CJ-5671','TCGA-EU-5906','TCGA-CZ-5988','TCGA-BP-5189','TCGA-CZ-5985','TCGA-B0-4833','TCGA-CJ-4912','TCGA-B0-4821','TCGA-CJ-4918','TCGA-CJ-4916','TCGA-B0-4823','TCGA-CZ-5989','TCGA-EU-5905','TCGA-BP-4989','TCGA-DV-5566','TCGA-BP-4963','TCGA-CJ-5677','TCGA-B4-5844','TCGA-AK-3425','TCGA-B2-5641','TCGA-A3-3376','TCGA-B0-4815','TCGA-CJ-4897','TCGA-CW-6090','TCGA-BP-4164','TCGA-BP-5177','TCGA-BP-4968','TCGA-BP-4971','TCGA-CJ-4905','TCGA-BP-5183','TCGA-B0-4694','TCGA-CZ-5453','TCGA-B0-4836','TCGA-BP-4174','TCGA-B0-4814','TCGA-A3-3347','TCGA-CJ-5678','TCGA-BP-4330','TCGA-BP-5004','TCGA-CJ-4640','TCGA-CZ-5460','TCGA-EU-5907','TCGA-B0-5075','TCGA-A3-3335','TCGA-A3-3322','TCGA-B0-4706','TCGA-B8-5550','TCGA-CZ-5987','TCGA-BP-5182','TCGA-CZ-5465','TCGA-CW-5587','TCGA-BP-4354','TCGA-CJ-4903','TCGA-A3-3325','TCGA-AK-3434','TCGA-BP-4982','TCGA-BP-5185','TCGA-CW-6093','TCGA-CJ-4869','TCGA-B0-4691','TCGA-B0-5702','TCGA-CZ-5466','TCGA-CW-6097','TCGA-AK-3436','TCGA-CW-5583','TCGA-BP-4787','TCGA-BP-4347','TCGA-DV-5568','TCGA-BP-5200','TCGA-BP-4158','TCGA-BP-5199','TCGA-B0-4846','TCGA-BP-4998','TCGA-BP-4774','TCGA-B0-4843','TCGA-CJ-4881','TCGA-B0-5106','TCGA-CJ-6030','TCGA-BP-4999','TCGA-CJ-4871','TCGA-BP-4167','TCGA-AK-3456','TCGA-B2-5639','TCGA-B8-5159','TCGA-CW-5584','TCGA-B0-4710','TCGA-B0-5102','TCGA-BP-4972','TCGA-BP-5006','TCGA-B0-5094','TCGA-CW-5580','TCGA-B0-5402','TCGA-CJ-4873','TCGA-BP-4162','TCGA-BP-5194','TCGA-CJ-5675','TCGA-BP-4987','TCGA-B0-4945','TCGA-B4-5377','TCGA-BP-4326','TCGA-B4-5843','TCGA-B8-4148','TCGA-CZ-4859','TCGA-B0-5700','TCGA-CJ-4639','TCGA-CW-5588','TCGA-B0-5121','TCGA-CZ-4854','TCGA-B8-5162','TCGA-B0-5113','TCGA-CZ-5455','TCGA-B0-5710','TCGA-AK-3455','TCGA-BP-4166','TCGA-BP-4981','TCGA-CJ-4876','TCGA-B0-4844','TCGA-CJ-4890','TCGA-B0-5115','TCGA-AK-3460','TCGA-BP-4777','TCGA-CJ-4875','TCGA-A3-3307','TCGA-BP-4776','TCGA-CJ-4923','TCGA-BP-4329','TCGA-CZ-5458','TCGA-B0-4816','TCGA-B0-4822','TCGA-BP-4331','TCGA-B0-4837','TCGA-B0-4818','TCGA-B2-5635','TCGA-CJ-4902','TCGA-B8-4153','TCGA-BP-4973','TCGA-BP-5184','TCGA-AK-3426','TCGA-BP-4173','TCGA-CW-5589','TCGA-B8-5158','TCGA-B2-5633','TCGA-B0-4714','TCGA-A3-3372','TCGA-BP-5000','TCGA-BP-4758','TCGA-CJ-4872','TCGA-CZ-5461','TCGA-CW-5591','TCGA-A3-3323','TCGA-BP-4775','TCGA-BP-5191','TCGA-CJ-5684','TCGA-BP-4765','TCGA-CJ-5689','TCGA-BP-5178','TCGA-B0-5693','TCGA-DV-5575','TCGA-CZ-4856','TCGA-B0-5399','TCGA-B0-5695','TCGA-BP-4789','TCGA-BP-5187','TCGA-CJ-5676','TCGA-CZ-5463','TCGA-B0-4848','TCGA-B0-4810','TCGA-CJ-4878','TCGA-BP-5195','TCGA-B0-5692','TCGA-BP-5175','TCGA-CJ-4870','TCGA-EU-5904','TCGA-BP-4959','TCGA-BP-4170','TCGA-B4-5832','TCGA-B0-5696','TCGA-B0-5080','TCGA-A3-3352','TCGA-B0-4847','TCGA-BP-4352','TCGA-CW-6088','TCGA-CJ-4901','TCGA-AK-3461','TCGA-B0-5690','TCGA-B2-4102','TCGA-B0-4845','TCGA-CZ-5467','TCGA-BP-4781','TCGA-CJ-4920','TCGA-A3-3331','TCGA-BP-5008','TCGA-B0-5104','TCGA-BP-4797','TCGA-AK-3429','TCGA-CJ-4913','TCGA-CJ-4899','TCGA-BP-4970','TCGA-B0-5698','TCGA-BP-4325','TCGA-B8-4146','TCGA-B0-5705','TCGA-A3-3383','TCGA-A3-3316','TCGA-BP-4771','TCGA-CZ-5982','TCGA-BP-4798','TCGA-B0-5099','TCGA-BP-4991','TCGA-CZ-5984','TCGA-CJ-5679','TCGA-BP-5009','TCGA-A3-3362','TCGA-A3-3387','TCGA-B8-5163','TCGA-A3-3358','TCGA-A3-3308','TCGA-B0-5707','TCGA-B8-5545','TCGA-BP-4962','TCGA-BP-4961','TCGA-A3-3329','TCGA-BP-4345','TCGA-B0-4701','TCGA-DV-5573','TCGA-BP-5007','TCGA-CJ-5672','TCGA-BP-4969','TCGA-AK-3454','TCGA-BP-4761','TCGA-CJ-4894','TCGA-BP-4341','TCGA-CZ-5452','TCGA-A3-3378','TCGA-A3-3311','TCGA-CJ-4900','TCGA-CZ-4861','TCGA-BP-4176','TCGA-CJ-4874','TCGA-B0-5701','TCGA-CZ-5451','TCGA-BP-4160','TCGA-CJ-6031','TCGA-CZ-4866','TCGA-CJ-5680','TCGA-B2-3924','TCGA-BP-4801','TCGA-BP-4976','TCGA-B0-5108','TCGA-B4-5834','TCGA-BP-4346','TCGA-BP-4964','TCGA-B4-5836','TCGA-A3-3326','TCGA-CZ-5459','TCGA-CZ-5468','TCGA-BP-4993','TCGA-BP-4762','TCGA-A3-3380','TCGA-CJ-4904','TCGA-CZ-4864','TCGA-BP-4763','TCGA-BP-4344','TCGA-B4-5838','TCGA-BP-4975','TCGA-BP-5180','TCGA-CZ-5986','TCGA-CJ-4868','TCGA-BP-4340','TCGA-B8-5549','TCGA-CW-5581','TCGA-B0-5699','TCGA-CZ-5464','TCGA-CJ-5683','TCGA-BP-4161','TCGA-B0-4813','TCGA-B0-5092','TCGA-CW-5585','TCGA-CZ-4862','TCGA-BP-4759','TCGA-A3-3319','TCGA-B8-4143','TCGA-DV-5569','TCGA-B0-5110','TCGA-CJ-4885','TCGA-BP-5202','TCGA-A3-3357','TCGA-CJ-4642','TCGA-A3-3324','TCGA-B0-4703','TCGA-BP-5176','TCGA-B0-4841','TCGA-B8-5165','TCGA-B0-4707','TCGA-AK-3428','TCGA-A3-3382','TCGA-B0-4849','TCGA-CZ-4853','TCGA-B0-5088','TCGA-B0-4839','TCGA-B0-5711','TCGA-BP-4803','TCGA-CJ-4636','TCGA-CJ-4892','TCGA-B0-4824','TCGA-BP-4342','TCGA-BP-4332','TCGA-B0-5694','TCGA-A3-3317','TCGA-CZ-4863','TCGA-CJ-4907','TCGA-B0-5116','TCGA-BP-5186','TCGA-CJ-4884','TCGA-A3-3320','TCGA-BP-4986','TCGA-CJ-4908','TCGA-BP-4351','TCGA-BP-4343','TCGA-BP-5190','TCGA-BP-4807','TCGA-CJ-4638','TCGA-B0-5706','TCGA-CJ-4893','TCGA-BP-4790','TCGA-A3-3373','TCGA-AS-3778','TCGA-AK-3451','TCGA-B0-5119','TCGA-CZ-5462','TCGA-BP-5192','TCGA-A3-3367','TCGA-A3-3336','TCGA-B0-5712','TCGA-CZ-5454','TCGA-B0-5120','TCGA-A3-3306','TCGA-A3-3370','TCGA-CJ-6033','TCGA-B8-5553','TCGA-A3-3365','TCGA-B0-5812','TCGA-CJ-5682','TCGA-CJ-4882','TCGA-B0-5697','TCGA-B0-5713','TCGA-CJ-4887','TCGA-CJ-4634','TCGA-BP-5001','TCGA-B0-4828','TCGA-BP-5201','TCGA-BP-4756','TCGA-BP-4977','TCGA-CJ-6032','TCGA-BP-4327','TCGA-CW-6096','TCGA-BP-5173','TCGA-BP-5168','TCGA-B0-4713','TCGA-CJ-4888','TCGA-B0-4838','TCGA-BP-5170','TCGA-CJ-4644','TCGA-BP-4768']
        hexNames = kircGbmHexnames + kircMainHexnames

        # Build the binary layer data, giving a zero for one attr & a one for the other
        aData = {}
        for hex in hexNames:
            if hex in kircGbmHexnames:
                aData[hex] = 0
            if hex in kircMainHexnames:
                aData[hex] = 1

        # Build the continuous layer data
        bData = {}
        with open('testData/continuous','rU') as fIn:
            fIn = csv.DictReader(fIn, delimiter='\t')
            for row in fIn:
                if row['id'] in hexNames and 'height' in row and row['height'] != None:
                    bData[row['id']] = row['height']

        # The stub layers struct is made up of both layers
        layers = {
            'kirc-groups': aData,
            'height': bData,
        }

        layerB, pValue = ForEachLayer.oneContinuousOneBinary(
            contLayers, layerA, layerB, layers, hexNames)
        s.assertTrue(pValue == 1)
    """
    def test_layoutInd_binCont(s):

        # Test the layout-independent binary-continuous stats
        contLayers = ['TF_IPL_MAD1L1']
        layerA = 'kirc-groups'
        layerB = 'TF_IPL_MAD1L1'

        kircGbmHexnames = ['TCGA-AK-3443','TCGA-BP-5198','TCGA-A3-3363','TCGA-BP-5010','TCGA-CZ-4860','TCGA-CZ-5457','TCGA-CJ-6028','TCGA-DV-5565','TCGA-CZ-4858','TCGA-CZ-4857','TCGA-B0-4700','TCGA-B8-4620','TCGA-B0-5096','TCGA-CW-6087','TCGA-B0-5100','TCGA-B0-4696','TCGA-CZ-5469','TCGA-BP-4766','TCGA-BP-4960','TCGA-BP-4967','TCGA-A3-3346','TCGA-B0-4690','TCGA-B8-4622','TCGA-CJ-4635','TCGA-AK-3430','TCGA-B0-4811','TCGA-BP-4992','TCGA-A3-3385','TCGA-CZ-5470']
        kircMainHexnames = ['TCGA-B0-5085','TCGA-B0-4718','TCGA-A3-3343','TCGA-BP-4965','TCGA-BP-4995','TCGA-BP-5174','TCGA-BP-4353','TCGA-B0-5703','TCGA-B8-5164','TCGA-A3-3359','TCGA-B0-5077','TCGA-CJ-4643','TCGA-DV-5574','TCGA-CJ-4895','TCGA-CJ-5686','TCGA-CJ-6027','TCGA-B0-4852','TCGA-AK-3458','TCGA-BP-5196','TCGA-B0-5095','TCGA-B2-4099','TCGA-AK-3444','TCGA-BP-4335','TCGA-BP-4163','TCGA-CW-5590','TCGA-BP-5181','TCGA-B8-4151','TCGA-B0-5107','TCGA-BP-4159','TCGA-B0-4693','TCGA-B2-4101','TCGA-BP-4804','TCGA-A3-3351','TCGA-CJ-5671','TCGA-EU-5906','TCGA-CZ-5988','TCGA-BP-5189','TCGA-CZ-5985','TCGA-B0-4833','TCGA-CJ-4912','TCGA-B0-4821','TCGA-CJ-4918','TCGA-CJ-4916','TCGA-B0-4823','TCGA-CZ-5989','TCGA-EU-5905','TCGA-BP-4989','TCGA-DV-5566','TCGA-BP-4963','TCGA-CJ-5677','TCGA-B4-5844','TCGA-AK-3425','TCGA-B2-5641','TCGA-A3-3376','TCGA-B0-4815','TCGA-CJ-4897','TCGA-CW-6090','TCGA-BP-4164','TCGA-BP-5177','TCGA-BP-4968','TCGA-BP-4971','TCGA-CJ-4905','TCGA-BP-5183','TCGA-B0-4694','TCGA-CZ-5453','TCGA-B0-4836','TCGA-BP-4174','TCGA-B0-4814','TCGA-A3-3347','TCGA-CJ-5678','TCGA-BP-4330','TCGA-BP-5004','TCGA-CJ-4640','TCGA-CZ-5460','TCGA-EU-5907','TCGA-B0-5075','TCGA-A3-3335','TCGA-A3-3322','TCGA-B0-4706','TCGA-B8-5550','TCGA-CZ-5987','TCGA-BP-5182','TCGA-CZ-5465','TCGA-CW-5587','TCGA-BP-4354','TCGA-CJ-4903','TCGA-A3-3325','TCGA-AK-3434','TCGA-BP-4982','TCGA-BP-5185','TCGA-CW-6093','TCGA-CJ-4869','TCGA-B0-4691','TCGA-B0-5702','TCGA-CZ-5466','TCGA-CW-6097','TCGA-AK-3436','TCGA-CW-5583','TCGA-BP-4787','TCGA-BP-4347','TCGA-DV-5568','TCGA-BP-5200','TCGA-BP-4158','TCGA-BP-5199','TCGA-B0-4846','TCGA-BP-4998','TCGA-BP-4774','TCGA-B0-4843','TCGA-CJ-4881','TCGA-B0-5106','TCGA-CJ-6030','TCGA-BP-4999','TCGA-CJ-4871','TCGA-BP-4167','TCGA-AK-3456','TCGA-B2-5639','TCGA-B8-5159','TCGA-CW-5584','TCGA-B0-4710','TCGA-B0-5102','TCGA-BP-4972','TCGA-BP-5006','TCGA-B0-5094','TCGA-CW-5580','TCGA-B0-5402','TCGA-CJ-4873','TCGA-BP-4162','TCGA-BP-5194','TCGA-CJ-5675','TCGA-BP-4987','TCGA-B0-4945','TCGA-B4-5377','TCGA-BP-4326','TCGA-B4-5843','TCGA-B8-4148','TCGA-CZ-4859','TCGA-B0-5700','TCGA-CJ-4639','TCGA-CW-5588','TCGA-B0-5121','TCGA-CZ-4854','TCGA-B8-5162','TCGA-B0-5113','TCGA-CZ-5455','TCGA-B0-5710','TCGA-AK-3455','TCGA-BP-4166','TCGA-BP-4981','TCGA-CJ-4876','TCGA-B0-4844','TCGA-CJ-4890','TCGA-B0-5115','TCGA-AK-3460','TCGA-BP-4777','TCGA-CJ-4875','TCGA-A3-3307','TCGA-BP-4776','TCGA-CJ-4923','TCGA-BP-4329','TCGA-CZ-5458','TCGA-B0-4816','TCGA-B0-4822','TCGA-BP-4331','TCGA-B0-4837','TCGA-B0-4818','TCGA-B2-5635','TCGA-CJ-4902','TCGA-B8-4153','TCGA-BP-4973','TCGA-BP-5184','TCGA-AK-3426','TCGA-BP-4173','TCGA-CW-5589','TCGA-B8-5158','TCGA-B2-5633','TCGA-B0-4714','TCGA-A3-3372','TCGA-BP-5000','TCGA-BP-4758','TCGA-CJ-4872','TCGA-CZ-5461','TCGA-CW-5591','TCGA-A3-3323','TCGA-BP-4775','TCGA-BP-5191','TCGA-CJ-5684','TCGA-BP-4765','TCGA-CJ-5689','TCGA-BP-5178','TCGA-B0-5693','TCGA-DV-5575','TCGA-CZ-4856','TCGA-B0-5399','TCGA-B0-5695','TCGA-BP-4789','TCGA-BP-5187','TCGA-CJ-5676','TCGA-CZ-5463','TCGA-B0-4848','TCGA-B0-4810','TCGA-CJ-4878','TCGA-BP-5195','TCGA-B0-5692','TCGA-BP-5175','TCGA-CJ-4870','TCGA-EU-5904','TCGA-BP-4959','TCGA-BP-4170','TCGA-B4-5832','TCGA-B0-5696','TCGA-B0-5080','TCGA-A3-3352','TCGA-B0-4847','TCGA-BP-4352','TCGA-CW-6088','TCGA-CJ-4901','TCGA-AK-3461','TCGA-B0-5690','TCGA-B2-4102','TCGA-B0-4845','TCGA-CZ-5467','TCGA-BP-4781','TCGA-CJ-4920','TCGA-A3-3331','TCGA-BP-5008','TCGA-B0-5104','TCGA-BP-4797','TCGA-AK-3429','TCGA-CJ-4913','TCGA-CJ-4899','TCGA-BP-4970','TCGA-B0-5698','TCGA-BP-4325','TCGA-B8-4146','TCGA-B0-5705','TCGA-A3-3383','TCGA-A3-3316','TCGA-BP-4771','TCGA-CZ-5982','TCGA-BP-4798','TCGA-B0-5099','TCGA-BP-4991','TCGA-CZ-5984','TCGA-CJ-5679','TCGA-BP-5009','TCGA-A3-3362','TCGA-A3-3387','TCGA-B8-5163','TCGA-A3-3358','TCGA-A3-3308','TCGA-B0-5707','TCGA-B8-5545','TCGA-BP-4962','TCGA-BP-4961','TCGA-A3-3329','TCGA-BP-4345','TCGA-B0-4701','TCGA-DV-5573','TCGA-BP-5007','TCGA-CJ-5672','TCGA-BP-4969','TCGA-AK-3454','TCGA-BP-4761','TCGA-CJ-4894','TCGA-BP-4341','TCGA-CZ-5452','TCGA-A3-3378','TCGA-A3-3311','TCGA-CJ-4900','TCGA-CZ-4861','TCGA-BP-4176','TCGA-CJ-4874','TCGA-B0-5701','TCGA-CZ-5451','TCGA-BP-4160','TCGA-CJ-6031','TCGA-CZ-4866','TCGA-CJ-5680','TCGA-B2-3924','TCGA-BP-4801','TCGA-BP-4976','TCGA-B0-5108','TCGA-B4-5834','TCGA-BP-4346','TCGA-BP-4964','TCGA-B4-5836','TCGA-A3-3326','TCGA-CZ-5459','TCGA-CZ-5468','TCGA-BP-4993','TCGA-BP-4762','TCGA-A3-3380','TCGA-CJ-4904','TCGA-CZ-4864','TCGA-BP-4763','TCGA-BP-4344','TCGA-B4-5838','TCGA-BP-4975','TCGA-BP-5180','TCGA-CZ-5986','TCGA-CJ-4868','TCGA-BP-4340','TCGA-B8-5549','TCGA-CW-5581','TCGA-B0-5699','TCGA-CZ-5464','TCGA-CJ-5683','TCGA-BP-4161','TCGA-B0-4813','TCGA-B0-5092','TCGA-CW-5585','TCGA-CZ-4862','TCGA-BP-4759','TCGA-A3-3319','TCGA-B8-4143','TCGA-DV-5569','TCGA-B0-5110','TCGA-CJ-4885','TCGA-BP-5202','TCGA-A3-3357','TCGA-CJ-4642','TCGA-A3-3324','TCGA-B0-4703','TCGA-BP-5176','TCGA-B0-4841','TCGA-B8-5165','TCGA-B0-4707','TCGA-AK-3428','TCGA-A3-3382','TCGA-B0-4849','TCGA-CZ-4853','TCGA-B0-5088','TCGA-B0-4839','TCGA-B0-5711','TCGA-BP-4803','TCGA-CJ-4636','TCGA-CJ-4892','TCGA-B0-4824','TCGA-BP-4342','TCGA-BP-4332','TCGA-B0-5694','TCGA-A3-3317','TCGA-CZ-4863','TCGA-CJ-4907','TCGA-B0-5116','TCGA-BP-5186','TCGA-CJ-4884','TCGA-A3-3320','TCGA-BP-4986','TCGA-CJ-4908','TCGA-BP-4351','TCGA-BP-4343','TCGA-BP-5190','TCGA-BP-4807','TCGA-CJ-4638','TCGA-B0-5706','TCGA-CJ-4893','TCGA-BP-4790','TCGA-A3-3373','TCGA-AS-3778','TCGA-AK-3451','TCGA-B0-5119','TCGA-CZ-5462','TCGA-BP-5192','TCGA-A3-3367','TCGA-A3-3336','TCGA-B0-5712','TCGA-CZ-5454','TCGA-B0-5120','TCGA-A3-3306','TCGA-A3-3370','TCGA-CJ-6033','TCGA-B8-5553','TCGA-A3-3365','TCGA-B0-5812','TCGA-CJ-5682','TCGA-CJ-4882','TCGA-B0-5697','TCGA-B0-5713','TCGA-CJ-4887','TCGA-CJ-4634','TCGA-BP-5001','TCGA-B0-4828','TCGA-BP-5201','TCGA-BP-4756','TCGA-BP-4977','TCGA-CJ-6032','TCGA-BP-4327','TCGA-CW-6096','TCGA-BP-5173','TCGA-BP-5168','TCGA-B0-4713','TCGA-CJ-4888','TCGA-B0-4838','TCGA-BP-5170','TCGA-CJ-4644','TCGA-BP-4768']
        hexNames = kircGbmHexnames + kircMainHexnames

        # Build the binary layer data, giving a zero for one attr & a one for the other
        aData = {}
        for hex in hexNames:
            if hex in kircGbmHexnames:
                aData[hex] = 0
            if hex in kircMainHexnames:
                aData[hex] = 1

        # Build the continuous layer data
        bData = {}
        with open('testData/continuous','rU') as fIn:
            fIn = csv.DictReader(fIn, delimiter='\t')
            for row in fIn:
                if row['id'] in hexNames and 'TF_IPL_MAD1L1' in row and row['TF_IPL_MAD1L1'] != None:
                    bData[row['id']] = row['TF_IPL_MAD1L1']

        # The stub layers struct is made up of both layers
        layers = {
            'kirc-groups': aData,
            'TF_IPL_MAD1L1': bData,
        }

        layerB, pValue = ForEachLayer.oneContinuousOneBinary(
            contLayers, layerA, layerB, layers, hexNames)
        print 'XXX TF... pValue', pValue
        s.assertTrue(pValue == 0.499) # mannWhitney
        #s.assertTrue(pValue == ?) # welch

if __name__ == '__main__':
    unittest.main()
